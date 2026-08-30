import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface KnowledgeRow {
  id: string;
  topic: string;
  question_patterns: string;
  keywords: string;
  content: string;
}

interface ChatRequest {
  question: string;
  history?: { role: string; content: string }[];
}

// Normalize text: lowercase, strip Kannada/English punctuation, collapse spaces
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tokenize into words (works for Latin and Kannada Unicode)
function tokenize(text: string): string[] {
  const normalized = normalize(text);
  return normalized.split(" ").filter((t) => t.length > 1);
}

// Score a knowledge chunk against the question using weighted keyword + pattern overlap
function scoreChunk(chunk: KnowledgeRow, questionTokens: string[], questionNorm: string): number {
  const keywords = tokenize(chunk.keywords);
  const patterns = normalize(chunk.question_patterns);
  const topicTokens = tokenize(chunk.topic);
  const contentTokens = new Set(tokenize(chunk.content));

  let score = 0;

  // Keyword overlap (high weight - these are curated)
  for (const kw of keywords) {
    if (questionTokens.includes(kw)) {
      score += 3;
    }
    // partial match for multi-word keywords
    if (kw.length > 3 && questionNorm.includes(kw)) {
      score += 1.5;
    }
  }

  // Pattern overlap (medium weight)
  for (const pt of tokenize(chunk.question_patterns)) {
    if (questionTokens.includes(pt)) {
      score += 2;
    }
  }

  // Topic overlap (high weight)
  for (const tp of topicTokens) {
    if (questionTokens.includes(tp)) {
      score += 2.5;
    }
  }

  // Content word overlap (low weight - broad signal)
  for (const qt of questionTokens) {
    if (contentTokens.has(qt)) {
      score += 0.5;
    }
  }

  return score;
}

// Detect language: Kannada if Unicode range matches, else English/mixed
function detectLanguage(text: string): "kannada" | "english" {
  const kannadaRange = /[\u0C80-\u0CFF]/;
  return kannadaRange.test(text) ? "kannada" : "english";
}

// Generate a natural-language answer from retrieved knowledge
function generateAnswer(
  question: string,
  retrieved: KnowledgeRow[]
): string {
  if (retrieved.length === 0) {
    return "I'm sorry, I don't have information about that right now. For detailed and accurate information, please contact the college directly at University College Of Science, Tumkur University Campus, BH Road, Tumkur - 572103, or call 0816-2203500. You can also email ucscience@tumkuruniversity.ac.in.";
  }

  const lang = detectLanguage(question);
  const topChunk = retrieved[0];
  const hasMultiple = retrieved.length > 1;

  // Build answer from top chunks, prioritizing the best match
  const primaryContent = topChunk.content;

  let answer = primaryContent;

  // If multiple relevant chunks, append additional context from second match if it adds new info
  if (hasMultiple) {
    const secondContent = retrieved[1].content;
    const primaryWords = new Set(tokenize(primaryContent));
    const secondWords = tokenize(secondContent);
    const novelWords = secondWords.filter((w) => !primaryWords.has(w) && w.length > 3);
    if (novelWords.length > 4) {
      answer += " Additionally, " + secondContent;
    }
  }

  // Add a friendly prefix based on language
  if (lang === "kannada") {
    // Keep answer in English (knowledge is in English) but acknowledge Kannada
    answer = "Here is the information you requested:\n\n" + answer;
  }

  return answer;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to read knowledge (RLS restricts anon reads, but we verify the caller)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the caller is authenticated via the Authorization header
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ChatRequest = await req.json();
    const question = (body.question ?? "").trim();

    if (!question) {
      return new Response(
        JSON.stringify({ answer: "Please ask a question about the college." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all active knowledge chunks
    const { data: knowledge, error: knowledgeError } = await supabase
      .from("chatbot_knowledge")
      .select("id, topic, question_patterns, keywords, content")
      .eq("is_active", true);

    if (knowledgeError) {
      return new Response(
        JSON.stringify({ error: "Failed to retrieve knowledge base" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chunks = (knowledge ?? []) as KnowledgeRow[];
    const questionNorm = normalize(question);
    const questionTokens = tokenize(question);

    // Score and rank chunks
    const scored = chunks
      .map((chunk) => ({
        chunk,
        score: scoreChunk(chunk, questionTokens, questionNorm),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.chunk);

    const answer = generateAnswer(question, scored);

    return new Response(
      JSON.stringify({ answer, matched: scored.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

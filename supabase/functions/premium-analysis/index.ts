// supabase/functions/premium-analysis/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-payment-response",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * This function provides information about the premium analysis service.
 * The actual premium analysis is handled by AWS Lambda with Amazon Nova Lite.
 *
 * AWS Lambda Endpoint: https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout
 * Model: amazon.nova-lite-v1:0
 * Region: eu-north-1
 */

const AWS_API_URL =
  "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout";

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // For GET requests, return service information
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        service: "Premium Fitness Analysis",
        status: "active",
        description: "AI-powered workout analysis using Amazon Nova Lite",
        endpoint: AWS_API_URL,
        model: "amazon.nova-lite-v1:0",
        region: "eu-north-1",
        features: [
          "Comprehensive form analysis",
          "Personalized feedback and recommendations",
          "Performance scoring and insights",
          "Expert-level coaching advice",
        ],
        usage:
          "Use x402 payment protocol to access premium analysis via the AWS endpoint",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // For POST requests, redirect to AWS Lambda
  if (req.method === "POST") {
    return new Response(
      JSON.stringify({
        message: "Premium analysis is now handled directly by AWS Lambda",
        redirect: AWS_API_URL,
        instructions:
          "Please send your workout data directly to the AWS endpoint with x402 payment",
      }),
      {
        status: 308, // Permanent Redirect
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          Location: AWS_API_URL,
        },
      }
    );
  }

  // Method not allowed
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(handler);

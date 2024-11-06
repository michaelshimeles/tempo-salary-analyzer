// app/api/scrape/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  let browser;
  try {
    const { url } = await req.json();

    if (!url.includes("lever.co")) {
      return NextResponse.json(
        { error: "Invalid URL. Need a Lever job posting." },
        { status: 400 }
      );
    }

    browser = await puppeteer.launch({
      headless: "shell",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const jobDetails = await page.evaluate(() => {
      return {
        title:
          document.querySelector(".posting-headline h2")?.textContent?.trim() ||
          "",
        location:
          document
            .querySelector(".posting-categories .location")
            ?.textContent?.trim() || "",
        commitment:
          document
            .querySelector(".posting-categories .commitment")
            ?.textContent?.trim() || "",
        team:
          document
            .querySelector(".posting-categories .team")
            ?.textContent?.trim() || "",
        sections: Array.from(document.querySelectorAll(".section")).map(
          (section) => ({
            title: section.querySelector("h3")?.textContent?.trim() || "",
            content:
              section.querySelector(".content")?.textContent?.trim() || "",
          })
        ),
        url: window.location.href,
        scrapedAt: new Date().toISOString(),
      };
    });

    await browser.close();

    // Prepare the job data for OpenAI
    const formattedJobData = `
              Job Details:
              Title: ${jobDetails.title}
              Location: ${jobDetails.location}
              Team: ${jobDetails.team}
              Commitment: ${jobDetails.commitment}

              Sections:
              ${jobDetails.sections.map(section => `${section.title}:\n${section.content}`).join('\n\n')}
                  `.trim();

                  // Get salary prediction from OpenAI
                  const completion = await openai.chat.completions.create({
                    messages: [
                      {
                        role: "system",
                        content: `You are an expert compensation analyst with deep knowledge of the tech industry and current market rates.
                        Analyze the job posting data provided and give a detailed salary prediction with explanation.

                        Format your response exactly as follows:

                        SALARY PREDICTION: [Provide a specific salary range in USD]

                        ANALYSIS:
                        - Role Level: [Determine the seniority/level of the position]
                        - Key Requirements: [List the most critical qualifications]
                        - Location Factor: [Discuss location impact on salary]
                        - Industry Context: [Mention relevant industry/market factors]

                        REASONING:
                        [Provide 2-3 sentences explaining how you arrived at this prediction]

                        CONFIDENCE: [High/Medium/Low] with brief explanation`
                      },
                      {
                        role: "user",
                        content: formattedJobData
                      }
                    ],
                    model: "gpt-4-turbo-preview",
                    temperature: 0.7,
                    stream: true
                  });

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Error in processing:", error);
    if (browser) {
      await browser.close();
    }
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
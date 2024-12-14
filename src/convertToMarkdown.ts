export async function convertToMarkdown(base64: string, apiKey: string): Promise<string> {
  const SYSTEM_PROMPT = `あなたはスクリーンショットをmarkdownに変換するアシスタントです。以下に注意して変換してください。

- 画像内の文字を読み取ってmarkdownに変換してください。その際、必要に応じてmarkdown tableやlist、boldなどの記法を使い、なるべく画像内の文字を忠実に再現するように努めてください。
  - 特にテーブルやリストでうまく表現できる場合は積極的に使ってください。
- 画像に文字がない場合は、空文字（""）を返してください。
- 回答形式は、変換したmarkdownのみとしてください。前置きや解説は不要です。`

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const payload = {
    "contents": {
      "role": "USER",
      "parts": [
        {
          "inlineData": {
            "data": base64,
            "mimeType": "image/png"
          }
        },
        {
          "text": "スクリーンショットをmarkdownに文字起こししてください。"
        }
      ]
    },
    "system_instruction": {
      "parts": [
        {
          "text": SYSTEM_PROMPT,
        }
      ]
    },
    "generation_config": {
      "temperature": 0,
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  const json = await response.json() as {
    candidates: {
      content: {
        parts: {
          text: string;
        }[];
      };
    }[];
  };
  const output = (json.candidates && json.candidates.length > 0 &&
    json.candidates[0].content && json.candidates[0].content.parts &&
    json.candidates[0].content.parts.length > 0)
    ? json.candidates[0].content.parts[0].text
    : "";

  console.log(output);

  return output;
}
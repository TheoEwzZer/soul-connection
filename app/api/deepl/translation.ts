const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

const NEXT_PUBLIC_DEEPL_API_KEY = process.env.NEXT_PUBLIC_DEEPL_API_KEY;

export async function translateText(
  text: string,
  targetLang: string
): Promise<any> {
  if (!NEXT_PUBLIC_DEEPL_API_KEY) {
    throw new Error("NEXT_PUBLIC_DEEPL_API_KEY is not defined");
  }
  try {
    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        auth_key: NEXT_PUBLIC_DEEPL_API_KEY,
        text: text,
        target_lang: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error("Erreur lors de la traduction:", error);
  }
}

"use client";

import { useState, useEffect, ReactElement, useMemo } from "react";
import { useTranslation } from "next-i18next";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SearchBar from "@/components/searchbar";
import UpAppearTransition from "@/components/UpAppearTransition";
import { translateText } from "../api/deepl/translation";
import i18n from "@/i18n";
import { Button } from "@/components/ui/button";

interface Tip {
  id: string;
  title: string;
  tip: string;
}

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

const Advices: () => ReactElement = (): ReactElement => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [translatedTips, setTranslatedTips] = useState<Tip[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [translatedQuery, setTranslatedQuery] = useState<string>("");
  const [blockTranslation, setBlockTranslation] = useState<boolean>(true);
  const { t } = useTranslation();

  const headers: HeadersInit = useMemo((): Record<string, string> => {
    const headersInit: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (NEXT_PUBLIC_GROUP_TOKEN) {
      headersInit["X-Group-Authorization"] = NEXT_PUBLIC_GROUP_TOKEN;
    } else {
      throw new Error("Group token is not set.");
    }

    return headersInit;
  }, []);

  const cachedTips = useMemo(() => {
    let cache: Tip[] | null = null;
    return {
      get: () => cache,
      set: (data: Tip[]) => {
        cache = data;
      },
    };
  }, []);

  useEffect((): void => {
    const fetchTips: () => Promise<void> = async (): Promise<void> => {
      try {
        const cachedData = cachedTips.get();
        if (cachedData) {
          setTips(cachedData);
          return;
        }

        const res: Response = await fetch("/api/tips", {
          method: "GET",
          headers,
        });
        const data: Tip[] = await res.json();
        setTips(data);
        cachedTips.set(data);
      } catch (error) {
        console.error("Error fetching tips:", error);
      }
    };

    fetchTips();
  }, [headers, cachedTips]);

  useEffect(() => {
    const translateTips = async () => {
      if (i18n.language === "fr" && !blockTranslation) {
        const translated = await Promise.all(
          tips.map(async (tip) => {
            const translatedTitle = await translateText(tip.title, "FR");
            const translatedTip = await translateText(tip.tip, "FR");
            return { ...tip, title: translatedTitle, tip: translatedTip };
          })
        );
        setTranslatedTips(translated);
      } else {
        setTranslatedTips(tips);
      }
    };

    if (tips.length > 0) {
      translateTips();
    }
  }, [tips, blockTranslation]);

  useEffect(() => {
    const translateQuery = async () => {
      if (searchQuery) {
        let translated;
        if (i18n.language === "fr" && !blockTranslation) {
          translated = await translateText(searchQuery, "FR");
        } else {
          translated = searchQuery;
        }
        setTranslatedQuery(translated);
      } else {
        setTranslatedQuery("");
      }
    };

    translateQuery();
  }, [searchQuery, blockTranslation]);

  const filteredTips: Tip[] = translatedTips.filter((tip: Tip): boolean =>
    tip.title.toLowerCase().includes(translatedQuery.toLowerCase())
  );

  return (
    <UpAppearTransition>
      <div className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-8 md:p-16 lg:p-24">
        <div className="w-full max-w-[1400px] bg-white dark:bg-black p-4 sm:p-8 rounded-lg border shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <CardTitle className="text-center sm:text-left mb-4 sm:mb-0">
                {t("tips.title")}
              </CardTitle>
              <SearchBar
                searchFilter={searchQuery}
                setSearchFilter={setSearchQuery}
              />
              <Button
                variant="outline"
                className="mt-4 sm:mt-0 sm:ml-4"
                onClick={() => setBlockTranslation(!blockTranslation)}
              >
                {blockTranslation
                  ? "Activer la traduction"
                  : "Bloquer la traduction"}
              </Button>
            </div>
            <div className="p-2"></div>
            <Accordion type="single" collapsible>
              {filteredTips.map(
                (question: Tip): ReactElement => (
                  <AccordionItem value={question.id} key={question.id}>
                    <AccordionTrigger className="text-left">
                      {question.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-left">
                      <p>{question.tip}</p>
                    </AccordionContent>
                  </AccordionItem>
                )
              )}
            </Accordion>
          </CardHeader>
        </div>
      </div>
    </UpAppearTransition>
  );
};

export default Advices;

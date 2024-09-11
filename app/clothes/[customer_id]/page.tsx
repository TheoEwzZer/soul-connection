"use client";

import React, { useState, useEffect, ReactElement, useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import UpAppearTransition from "@/components/UpAppearTransition";
import Image from "next/image";

const itemsPerPage = 5;
const itemsPerPageMobile = 4;

interface Clothe {
  id: number;
  type: string;
  image: string;
}

interface ClotheResponseString {
  image_url: string | null;
}

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

export default function Wardrobe({
  params,
}: {
  params: { customer_id: string };
}): ReactElement {
  const { customer_id } = params;
  const [clothes, setClothes] = useState<Clothe[]>([]);
  const [currentPageHat, setCurrentPageHat] = useState(0);
  const [currentPageTop, setCurrentPageTop] = useState(0);
  const [currentPagePants, setCurrentPagePants] = useState(0);
  const [currentPageShoes, setCurrentPageShoes] = useState(0);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: any }>(
    {}
  );
  const { t } = useTranslation();

  const types: string[] = ["hat/cap", "top", "bottom", "shoes"];

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

  useEffect((): void => {
    const fetchClothes: () => Promise<void> = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/customers/${customer_id}/clothes`, {
          method: "GET",
          headers,
        });
        const data = await response.json();

        const clothesWithImages: any[] = await Promise.all(
          data.map(async (clothe: Clothe) => {
            const imageResponse: Response = await fetch(
              `/api/clothes/${clothe.id}/image`,
              {
                method: "GET",
                headers,
              }
            );
            const imageData: ClotheResponseString = await imageResponse.json();
            return { ...clothe, image: imageData.image_url };
          })
        );

        setClothes(clothesWithImages);
      } catch (error) {
        console.error("Error fetching clothes:", error);
      }
    };

    fetchClothes();
  }, [headers, customer_id]);

  const getItemsByType: (type: string) => Clothe[] = (type: string): Clothe[] =>
    clothes.filter((item: Clothe): boolean => item.type === type);

  const handlePreviousPage: (type: string) => void = (type: string): void => {
    switch (type) {
      case "hat/cap":
        setCurrentPageHat((prevPage: number): number =>
          Math.max(prevPage - 1, 0)
        );
        break;
      case "top":
        setCurrentPageTop((prevPage: number): number =>
          Math.max(prevPage - 1, 0)
        );
        break;
      case "bottom":
        setCurrentPagePants((prevPage: number): number =>
          Math.max(prevPage - 1, 0)
        );
        break;
      case "shoes":
        setCurrentPageShoes((prevPage: number): number =>
          Math.max(prevPage - 1, 0)
        );
        break;
      default:
        break;
    }
  };

  const handleNextPage: (type: string, totalPages: number) => void = (
    type: string,
    totalPages: number
  ): void => {
    switch (type) {
      case "hat/cap":
        setCurrentPageHat((prevPage: number): number =>
          Math.min(prevPage + 1, totalPages - 1)
        );
        break;
      case "top":
        setCurrentPageTop((prevPage: number): number =>
          Math.min(prevPage + 1, totalPages - 1)
        );
        break;
      case "bottom":
        setCurrentPagePants((prevPage: number): number =>
          Math.min(prevPage + 1, totalPages - 1)
        );
        break;
      case "shoes":
        setCurrentPageShoes((prevPage: number): number =>
          Math.min(prevPage + 1, totalPages - 1)
        );
        break;
      default:
        break;
    }
  };

  const handleSelectItem: (item: Clothe) => void = (item: Clothe): void => {
    setSelectedItems((prevSelectedItems: { [key: string]: any }) => ({
      ...prevSelectedItems,
      [item.type]: item,
    }));
  };

  const renderItems: (type: string, currentPage: number) => ReactElement = (
    type: string,
    currentPage: number
  ): ReactElement => {
    const items: Clothe[] = getItemsByType(type);
    const isMobile = window.innerWidth < 640;
    const itemsPerPage = isMobile ? itemsPerPageMobile : 5;
    const totalPages: number = Math.ceil(items.length / itemsPerPage);
    const startIndex: number = currentPage * itemsPerPage;
    const currentItems: Clothe[] = items.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return (
      <UpAppearTransition>
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold capitalize">
              {t(`Clothes.${type}`)}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={(): void => handlePreviousPage(type)}
                disabled={currentPage === 0}
                className="bg-black text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span>
                {t("page")} {currentPage + 1} {t("Clothes.of")} {totalPages}
              </span>
              <Button
                onClick={(): void => handleNextPage(type, totalPages)}
                disabled={currentPage === totalPages - 1}
                className="bg-black text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex overflow-x-auto space-x-4">
            {currentItems.map(
              (item: Clothe): ReactElement => (
                <div
                  key={item.id}
                  className={`bg-white p-4 rounded-lg shadow-md flex flex-col items-center cursor-pointer ${
                    selectedItems[type]?.id === item.id
                      ? "border-2 border-blue-500"
                      : ""
                  }`}
                  onClick={(): void => handleSelectItem(item)}
                >
                  <Image
                    src={item.image}
                    alt={item.type}
                    width={128}
                    height={128}
                    className="w-32 h-32 object-cover mb-2 rounded"
                  />
                </div>
              )
            )}
          </div>
        </div>
      </UpAppearTransition>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <main className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold">{t("Clothes.wardrobe")}</h1>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-black text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("Clothes.back")}
            </Button>
          </div>
          {renderItems("hat/cap", currentPageHat)}
          {renderItems("top", currentPageTop)}
          {renderItems("bottom", currentPagePants)}
          {renderItems("shoes", currentPageShoes)}
        </div>
        <div className="w-full lg:w-1/4 p-4 sm:p-8 bg-white rounded-lg shadow-md mt-8 lg:mt-0 lg:ml-16 flex flex-col items-center justify-center">
          {Object.keys(selectedItems).length > 0 ? (
            <div className="flex flex-col items-center">
              {types.map(
                (type: string): any =>
                  selectedItems[type] && (
                    <div key={type} className="mb-8">
                      <Image
                        src={selectedItems[type].image}
                        alt={selectedItems[type].nom}
                        width={192}
                        height={192}
                        className="object-cover mb-4 rounded"
                      />
                      <p className="text-center font-medium">
                        {selectedItems[type].nom}
                      </p>
                    </div>
                  )
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500">{t("Clothes.select")}</p>
          )}
        </div>
      </main>
    </div>
  );
}
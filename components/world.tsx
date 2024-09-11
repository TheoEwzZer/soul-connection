"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { Feature, FeatureCollection, Geometry } from "geojson";
import { useTranslation } from "next-i18next";

interface Customer {
  id: string;
  name: string;
  surname: string;
  email: string;
  country: string;
  latitude: number;
  longitude: number;
}

export default function WorldMap({ customers }: { customers: Customer[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!customers || customers.length === 0 || !svgRef.current) {
      return;
    }

    const width = 800;
    const height = 450;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const projection = d3
      .geoMercator()
      .scale(120)
      .center([20, 0])
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    const customersByCountry = d3.group(customers, () => "France");
    const maxCustomers =
      d3.max(Array.from(customersByCountry.values(), (v) => v.length)) || 0;
    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([1, maxCustomers]);

    // Create a tooltip div
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px");

    d3.json(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    ).then((world: any) => {
      const countries = topojson.feature(
        world,
        world.objects.countries
      ) as unknown as FeatureCollection<Geometry, any>;

      svg
        .selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", (d) => path(d as Feature<Geometry, any>) || "")
        .attr("fill", (d) => {
          const countryName = (d.properties as any).name;
          const countryCustomers = customersByCountry.get(countryName);
          return countryCustomers
            ? colorScale(countryCustomers.length)
            : "#f0f0f0";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function (event, d) {
          const countryName = (d.properties as any).name;
          const countryCustomers = customersByCountry.get(countryName);
          const customersCount = countryCustomers ? countryCustomers.length : 0;

          if (customersCount > 0) {
            d3.select(this).attr("stroke", "#000").attr("stroke-width", 1);

            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(`${countryName}: ${customersCount} client(s)`)
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          }
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
          tooltip.transition().duration(500).style("opacity", 0);
        });
    });

    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [customers]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('analytics.customer_by_country')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-[16/9]">
          <svg ref={svgRef} className="w-full h-full"></svg>
        </div>
      </CardContent>
    </Card>
  );
}

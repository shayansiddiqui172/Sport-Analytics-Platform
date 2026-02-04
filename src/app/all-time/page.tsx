"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  Button,
  Badge,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";

const allTimeGreats = [
  {
    rank: 1,
    name: "Michael Jordan",
    position: "SG",
    years: "1984-2003",
    teams: ["Chicago Bulls", "Washington Wizards"],
    stats: { ppg: 30.1, rpg: 6.2, apg: 5.3, championships: 6, mvps: 5 },
    accolades: ["6x NBA Champion", "6x Finals MVP", "5x MVP", "14x All-Star"],
  },
  {
    rank: 2,
    name: "LeBron James",
    position: "SF",
    years: "2003-Present",
    teams: ["Cavaliers", "Heat", "Lakers"],
    stats: { ppg: 27.1, rpg: 7.5, apg: 7.4, championships: 4, mvps: 4 },
    accolades: ["4x NBA Champion", "4x Finals MVP", "4x MVP", "20x All-Star"],
  },
  {
    rank: 3,
    name: "Kareem Abdul-Jabbar",
    position: "C",
    years: "1969-1989",
    teams: ["Milwaukee Bucks", "Los Angeles Lakers"],
    stats: { ppg: 24.6, rpg: 11.2, apg: 3.6, championships: 6, mvps: 6 },
    accolades: ["6x NBA Champion", "2x Finals MVP", "6x MVP", "19x All-Star"],
  },
  {
    rank: 4,
    name: "Magic Johnson",
    position: "PG",
    years: "1979-1996",
    teams: ["Los Angeles Lakers"],
    stats: { ppg: 19.5, rpg: 7.2, apg: 11.2, championships: 5, mvps: 3 },
    accolades: ["5x NBA Champion", "3x Finals MVP", "3x MVP", "12x All-Star"],
  },
  {
    rank: 5,
    name: "Larry Bird",
    position: "SF",
    years: "1979-1992",
    teams: ["Boston Celtics"],
    stats: { ppg: 24.3, rpg: 10.0, apg: 6.3, championships: 3, mvps: 3 },
    accolades: ["3x NBA Champion", "2x Finals MVP", "3x MVP", "12x All-Star"],
  },
  {
    rank: 6,
    name: "Tim Duncan",
    position: "PF/C",
    years: "1997-2016",
    teams: ["San Antonio Spurs"],
    stats: { ppg: 19.0, rpg: 10.8, apg: 3.0, championships: 5, mvps: 2 },
    accolades: ["5x NBA Champion", "3x Finals MVP", "2x MVP", "15x All-Star"],
  },
  {
    rank: 7,
    name: "Kobe Bryant",
    position: "SG",
    years: "1996-2016",
    teams: ["Los Angeles Lakers"],
    stats: { ppg: 25.0, rpg: 5.2, apg: 4.7, championships: 5, mvps: 1 },
    accolades: ["5x NBA Champion", "2x Finals MVP", "1x MVP", "18x All-Star"],
  },
  {
    rank: 8,
    name: "Shaquille O'Neal",
    position: "C",
    years: "1992-2011",
    teams: ["Magic", "Lakers", "Heat", "Suns", "Cavs", "Celtics"],
    stats: { ppg: 23.7, rpg: 10.9, apg: 2.5, championships: 4, mvps: 1 },
    accolades: ["4x NBA Champion", "3x Finals MVP", "1x MVP", "15x All-Star"],
  },
  {
    rank: 9,
    name: "Hakeem Olajuwon",
    position: "C",
    years: "1984-2002",
    teams: ["Houston Rockets", "Toronto Raptors"],
    stats: { ppg: 21.8, rpg: 11.1, apg: 2.5, championships: 2, mvps: 1 },
    accolades: ["2x NBA Champion", "2x Finals MVP", "1x MVP", "12x All-Star"],
  },
  {
    rank: 10,
    name: "Bill Russell",
    position: "C",
    years: "1956-1969",
    teams: ["Boston Celtics"],
    stats: { ppg: 15.1, rpg: 22.5, apg: 4.3, championships: 11, mvps: 5 },
    accolades: ["11x NBA Champion", "5x MVP", "12x All-Star"],
  },
  {
    rank: 11,
    name: "Wilt Chamberlain",
    position: "C",
    years: "1959-1973",
    teams: ["Warriors", "76ers", "Lakers"],
    stats: { ppg: 30.1, rpg: 22.9, apg: 4.4, championships: 2, mvps: 4 },
    accolades: ["2x NBA Champion", "1x Finals MVP", "4x MVP", "13x All-Star"],
  },
  {
    rank: 12,
    name: "Stephen Curry",
    position: "PG",
    years: "2009-Present",
    teams: ["Golden State Warriors"],
    stats: { ppg: 24.8, rpg: 4.7, apg: 6.4, championships: 4, mvps: 2 },
    accolades: ["4x NBA Champion", "1x Finals MVP", "2x MVP", "10x All-Star"],
  },
  {
    rank: 13,
    name: "Kevin Durant",
    position: "SF",
    years: "2007-Present",
    teams: ["Thunder", "Warriors", "Nets", "Suns"],
    stats: { ppg: 27.3, rpg: 7.1, apg: 4.4, championships: 2, mvps: 1 },
    accolades: ["2x NBA Champion", "2x Finals MVP", "1x MVP", "14x All-Star"],
  },
  {
    rank: 14,
    name: "Oscar Robertson",
    position: "PG",
    years: "1960-1974",
    teams: ["Cincinnati Royals", "Milwaukee Bucks"],
    stats: { ppg: 25.7, rpg: 7.5, apg: 9.5, championships: 1, mvps: 1 },
    accolades: ["1x NBA Champion", "1x MVP", "12x All-Star"],
  },
  {
    rank: 15,
    name: "Nikola Jokic",
    position: "C",
    years: "2015-Present",
    teams: ["Denver Nuggets"],
    stats: { ppg: 20.9, rpg: 10.4, apg: 7.3, championships: 1, mvps: 3 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "3x MVP", "6x All-Star"],
  },
  {
    rank: 16,
    name: "Giannis Antetokounmpo",
    position: "PF",
    years: "2013-Present",
    teams: ["Milwaukee Bucks"],
    stats: { ppg: 23.4, rpg: 9.8, apg: 5.0, championships: 1, mvps: 2 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "2x MVP", "8x All-Star"],
  },
  {
    rank: 17,
    name: "Dirk Nowitzki",
    position: "PF",
    years: "1998-2019",
    teams: ["Dallas Mavericks"],
    stats: { ppg: 20.7, rpg: 7.5, apg: 2.4, championships: 1, mvps: 1 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "1x MVP", "14x All-Star"],
  },
  {
    rank: 18,
    name: "Kevin Garnett",
    position: "PF",
    years: "1995-2016",
    teams: ["Timberwolves", "Celtics", "Nets"],
    stats: { ppg: 17.8, rpg: 10.0, apg: 3.7, championships: 1, mvps: 1 },
    accolades: ["1x NBA Champion", "1x MVP", "15x All-Star"],
  },
  {
    rank: 19,
    name: "Julius Erving",
    position: "SF",
    years: "1971-1987",
    teams: ["Nets", "76ers"],
    stats: { ppg: 24.2, rpg: 8.5, apg: 4.2, championships: 1, mvps: 1 },
    accolades: ["1x NBA Champion", "1x MVP", "11x All-Star"],
  },
  {
    rank: 20,
    name: "Karl Malone",
    position: "PF",
    years: "1985-2004",
    teams: ["Utah Jazz", "Los Angeles Lakers"],
    stats: { ppg: 25.0, rpg: 10.1, apg: 3.6, championships: 0, mvps: 2 },
    accolades: ["2x MVP", "14x All-Star"],
  },
  {
    rank: 21,
    name: "Charles Barkley",
    position: "PF",
    years: "1984-2000",
    teams: ["76ers", "Suns", "Rockets"],
    stats: { ppg: 22.1, rpg: 11.7, apg: 3.9, championships: 0, mvps: 1 },
    accolades: ["1x MVP", "11x All-Star"],
  },
  {
    rank: 22,
    name: "David Robinson",
    position: "C",
    years: "1989-2003",
    teams: ["San Antonio Spurs"],
    stats: { ppg: 21.1, rpg: 10.6, apg: 2.5, championships: 2, mvps: 1 },
    accolades: ["2x NBA Champion", "1x MVP", "10x All-Star"],
  },
  {
    rank: 23,
    name: "Dwyane Wade",
    position: "SG",
    years: "2003-2019",
    teams: ["Heat", "Bulls", "Cavaliers"],
    stats: { ppg: 22.0, rpg: 4.7, apg: 5.4, championships: 3, mvps: 0 },
    accolades: ["3x NBA Champion", "1x Finals MVP", "13x All-Star"],
  },
  {
    rank: 24,
    name: "Moses Malone",
    position: "C",
    years: "1974-1995",
    teams: ["Rockets", "76ers", "Bullets", "Hawks", "Bucks", "Spurs"],
    stats: { ppg: 20.6, rpg: 12.2, apg: 1.4, championships: 1, mvps: 3 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "3x MVP", "12x All-Star"],
  },
  {
    rank: 25,
    name: "Jerry West",
    position: "SG",
    years: "1960-1974",
    teams: ["Los Angeles Lakers"],
    stats: { ppg: 27.0, rpg: 5.8, apg: 6.7, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "14x All-Star"],
  },
  {
    rank: 26,
    name: "Kawhi Leonard",
    position: "SF",
    years: "2011-Present",
    teams: ["Spurs", "Raptors", "Clippers"],
    stats: { ppg: 20.0, rpg: 6.5, apg: 3.0, championships: 2, mvps: 0 },
    accolades: ["2x NBA Champion", "2x Finals MVP", "5x All-Star"],
  },
  {
    rank: 27,
    name: "Allen Iverson",
    position: "PG/SG",
    years: "1996-2010",
    teams: ["76ers", "Nuggets", "Pistons", "Grizzlies"],
    stats: { ppg: 26.7, rpg: 3.7, apg: 6.2, championships: 0, mvps: 1 },
    accolades: ["1x MVP", "11x All-Star"],
  },
  {
    rank: 28,
    name: "Scottie Pippen",
    position: "SF",
    years: "1987-2004",
    teams: ["Bulls", "Rockets", "Trail Blazers"],
    stats: { ppg: 16.1, rpg: 6.4, apg: 5.2, championships: 6, mvps: 0 },
    accolades: ["6x NBA Champion", "7x All-Star"],
  },
  {
    rank: 29,
    name: "John Stockton",
    position: "PG",
    years: "1984-2003",
    teams: ["Utah Jazz"],
    stats: { ppg: 13.1, rpg: 2.7, apg: 10.5, championships: 0, mvps: 0 },
    accolades: ["10x All-Star", "All-Time Assists Leader"],
  },
  {
    rank: 30,
    name: "Isiah Thomas",
    position: "PG",
    years: "1981-1994",
    teams: ["Detroit Pistons"],
    stats: { ppg: 19.2, rpg: 3.6, apg: 9.3, championships: 2, mvps: 0 },
    accolades: ["2x NBA Champion", "1x Finals MVP", "12x All-Star"],
  },
  {
    rank: 31,
    name: "Patrick Ewing",
    position: "C",
    years: "1985-2002",
    teams: ["Knicks", "Sonics", "Magic"],
    stats: { ppg: 21.0, rpg: 9.8, apg: 1.9, championships: 0, mvps: 0 },
    accolades: ["11x All-Star"],
  },
  {
    rank: 32,
    name: "Elgin Baylor",
    position: "SF",
    years: "1958-1971",
    teams: ["Minneapolis/Los Angeles Lakers"],
    stats: { ppg: 27.4, rpg: 13.5, apg: 4.3, championships: 0, mvps: 0 },
    accolades: ["11x All-Star"],
  },
  {
    rank: 33,
    name: "Chris Paul",
    position: "PG",
    years: "2005-Present",
    teams: ["Hornets", "Clippers", "Rockets", "Thunder", "Suns", "Warriors", "Spurs"],
    stats: { ppg: 17.5, rpg: 4.5, apg: 9.4, championships: 0, mvps: 0 },
    accolades: ["12x All-Star"],
  },
  {
    rank: 34,
    name: "Kevin McHale",
    position: "PF",
    years: "1980-1993",
    teams: ["Boston Celtics"],
    stats: { ppg: 17.9, rpg: 7.3, apg: 1.7, championships: 3, mvps: 0 },
    accolades: ["3x NBA Champion", "7x All-Star"],
  },
  {
    rank: 35,
    name: "James Harden",
    position: "SG",
    years: "2009-Present",
    teams: ["Thunder", "Rockets", "Nets", "76ers", "Clippers"],
    stats: { ppg: 24.1, rpg: 5.6, apg: 7.1, championships: 0, mvps: 1 },
    accolades: ["1x MVP", "10x All-Star"],
  },
  {
    rank: 36,
    name: "Russell Westbrook",
    position: "PG",
    years: "2008-Present",
    teams: ["Thunder", "Rockets", "Wizards", "Lakers", "Clippers", "Nuggets"],
    stats: { ppg: 21.7, rpg: 7.1, apg: 8.1, championships: 0, mvps: 1 },
    accolades: ["1x MVP", "9x All-Star"],
  },
  {
    rank: 37,
    name: "Bob Pettit",
    position: "PF/C",
    years: "1954-1965",
    teams: ["Milwaukee/St. Louis Hawks"],
    stats: { ppg: 26.4, rpg: 16.2, apg: 3.0, championships: 1, mvps: 2 },
    accolades: ["1x NBA Champion", "2x MVP", "11x All-Star"],
  },
  {
    rank: 38,
    name: "Clyde Drexler",
    position: "SG",
    years: "1983-1998",
    teams: ["Trail Blazers", "Rockets"],
    stats: { ppg: 20.4, rpg: 6.1, apg: 5.6, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "10x All-Star"],
  },
  {
    rank: 39,
    name: "Gary Payton",
    position: "PG",
    years: "1990-2007",
    teams: ["Sonics", "Bucks", "Lakers", "Celtics", "Heat"],
    stats: { ppg: 16.3, rpg: 3.9, apg: 6.7, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "9x All-Star", "1x DPOY"],
  },
  {
    rank: 40,
    name: "Walt Frazier",
    position: "PG",
    years: "1967-1980",
    teams: ["New York Knicks", "Cleveland Cavaliers"],
    stats: { ppg: 18.9, rpg: 5.9, apg: 6.1, championships: 2, mvps: 0 },
    accolades: ["2x NBA Champion", "7x All-Star"],
  },
  {
    rank: 41,
    name: "Luka Doncic",
    position: "PG/SG",
    years: "2018-Present",
    teams: ["Dallas Mavericks"],
    stats: { ppg: 28.7, rpg: 8.7, apg: 8.3, championships: 0, mvps: 0 },
    accolades: ["6x All-Star", "ROY"],
  },
  {
    rank: 42,
    name: "Anthony Davis",
    position: "PF/C",
    years: "2012-Present",
    teams: ["Pelicans", "Lakers"],
    stats: { ppg: 24.1, rpg: 10.5, apg: 2.5, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "9x All-Star"],
  },
  {
    rank: 43,
    name: "Joel Embiid",
    position: "C",
    years: "2016-Present",
    teams: ["Philadelphia 76ers"],
    stats: { ppg: 27.9, rpg: 11.2, apg: 3.6, championships: 0, mvps: 1 },
    accolades: ["1x MVP", "7x All-Star"],
  },
  {
    rank: 44,
    name: "John Havlicek",
    position: "SF/SG",
    years: "1962-1978",
    teams: ["Boston Celtics"],
    stats: { ppg: 20.8, rpg: 6.3, apg: 4.8, championships: 8, mvps: 0 },
    accolades: ["8x NBA Champion", "1x Finals MVP", "13x All-Star"],
  },
  {
    rank: 45,
    name: "Rick Barry",
    position: "SF",
    years: "1965-1980",
    teams: ["Warriors", "Nets", "Rockets"],
    stats: { ppg: 23.2, rpg: 6.5, apg: 5.1, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "8x All-Star"],
  },
  {
    rank: 46,
    name: "Paul Pierce",
    position: "SF",
    years: "1998-2017",
    teams: ["Celtics", "Nets", "Wizards", "Clippers"],
    stats: { ppg: 19.7, rpg: 5.6, apg: 3.5, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "10x All-Star"],
  },
  {
    rank: 47,
    name: "Ray Allen",
    position: "SG",
    years: "1996-2014",
    teams: ["Bucks", "Sonics", "Celtics", "Heat"],
    stats: { ppg: 18.9, rpg: 4.1, apg: 3.4, championships: 2, mvps: 0 },
    accolades: ["2x NBA Champion", "10x All-Star"],
  },
  {
    rank: 48,
    name: "Jason Kidd",
    position: "PG",
    years: "1994-2013",
    teams: ["Mavericks", "Suns", "Nets", "Knicks"],
    stats: { ppg: 12.6, rpg: 6.3, apg: 8.7, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "10x All-Star"],
  },
  {
    rank: 49,
    name: "Steve Nash",
    position: "PG",
    years: "1996-2015",
    teams: ["Suns", "Mavericks", "Lakers"],
    stats: { ppg: 14.3, rpg: 3.0, apg: 8.5, championships: 0, mvps: 2 },
    accolades: ["2x MVP", "8x All-Star"],
  },
  {
    rank: 50,
    name: "Damian Lillard",
    position: "PG",
    years: "2012-Present",
    teams: ["Trail Blazers", "Bucks"],
    stats: { ppg: 25.2, rpg: 4.2, apg: 6.7, championships: 0, mvps: 0 },
    accolades: ["8x All-Star", "ROY"],
  },
  {
    rank: 51,
    name: "Jayson Tatum",
    position: "SF",
    years: "2017-Present",
    teams: ["Boston Celtics"],
    stats: { ppg: 23.1, rpg: 7.2, apg: 4.6, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "6x All-Star"],
  },
  {
    rank: 52,
    name: "Jimmy Butler",
    position: "SF/SG",
    years: "2011-Present",
    teams: ["Bulls", "Timberwolves", "76ers", "Heat"],
    stats: { ppg: 18.2, rpg: 5.5, apg: 4.5, championships: 0, mvps: 0 },
    accolades: ["7x All-Star"],
  },
  {
    rank: 53,
    name: "Shai Gilgeous-Alexander",
    position: "SG",
    years: "2018-Present",
    teams: ["Clippers", "Thunder"],
    stats: { ppg: 24.2, rpg: 5.2, apg: 5.6, championships: 0, mvps: 0 },
    accolades: ["3x All-Star"],
  },
  {
    rank: 54,
    name: "Dennis Rodman",
    position: "PF",
    years: "1986-2000",
    teams: ["Pistons", "Spurs", "Bulls", "Lakers", "Mavericks"],
    stats: { ppg: 7.3, rpg: 13.1, apg: 1.8, championships: 5, mvps: 0 },
    accolades: ["5x NBA Champion", "2x DPOY", "2x All-Star"],
  },
  {
    rank: 55,
    name: "Alonzo Mourning",
    position: "C",
    years: "1992-2008",
    teams: ["Hornets", "Heat", "Nets"],
    stats: { ppg: 17.1, rpg: 8.5, apg: 1.1, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "2x DPOY", "7x All-Star"],
  },
  {
    rank: 56,
    name: "Tracy McGrady",
    position: "SG/SF",
    years: "1997-2013",
    teams: ["Raptors", "Magic", "Rockets", "Knicks", "Hawks", "Spurs"],
    stats: { ppg: 19.6, rpg: 5.6, apg: 4.4, championships: 0, mvps: 0 },
    accolades: ["7x All-Star", "2x Scoring Champion"],
  },
  {
    rank: 57,
    name: "Vince Carter",
    position: "SG/SF",
    years: "1998-2020",
    teams: ["Raptors", "Nets", "Magic", "Suns", "Mavericks", "Grizzlies", "Kings", "Hawks"],
    stats: { ppg: 16.7, rpg: 4.3, apg: 3.1, championships: 0, mvps: 0 },
    accolades: ["8x All-Star", "ROY"],
  },
  {
    rank: 58,
    name: "Reggie Miller",
    position: "SG",
    years: "1987-2005",
    teams: ["Indiana Pacers"],
    stats: { ppg: 18.2, rpg: 3.0, apg: 3.0, championships: 0, mvps: 0 },
    accolades: ["5x All-Star"],
  },
  {
    rank: 59,
    name: "Dominique Wilkins",
    position: "SF",
    years: "1982-1999",
    teams: ["Hawks", "Clippers", "Celtics", "Spurs", "Magic"],
    stats: { ppg: 24.8, rpg: 6.7, apg: 2.5, championships: 0, mvps: 0 },
    accolades: ["9x All-Star", "1x Scoring Champion"],
  },
  {
    rank: 60,
    name: "George Gervin",
    position: "SG",
    years: "1972-1986",
    teams: ["Squires", "Spurs", "Bulls"],
    stats: { ppg: 26.2, rpg: 5.3, apg: 2.6, championships: 0, mvps: 0 },
    accolades: ["9x All-Star", "4x Scoring Champion"],
  },
  {
    rank: 61,
    name: "Kyrie Irving",
    position: "PG",
    years: "2011-Present",
    teams: ["Cavaliers", "Celtics", "Nets", "Mavericks"],
    stats: { ppg: 23.6, rpg: 3.8, apg: 5.7, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "8x All-Star"],
  },
  {
    rank: 62,
    name: "Dwight Howard",
    position: "C",
    years: "2004-2024",
    teams: ["Magic", "Lakers", "Rockets", "Hawks", "Hornets", "Wizards", "76ers"],
    stats: { ppg: 15.7, rpg: 11.8, apg: 1.3, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "3x DPOY", "8x All-Star"],
  },
  {
    rank: 63,
    name: "Carmelo Anthony",
    position: "SF",
    years: "2003-2022",
    teams: ["Nuggets", "Knicks", "Thunder", "Rockets", "Trail Blazers", "Lakers"],
    stats: { ppg: 22.5, rpg: 6.2, apg: 2.7, championships: 0, mvps: 0 },
    accolades: ["10x All-Star", "1x Scoring Champion"],
  },
  {
    rank: 64,
    name: "Willis Reed",
    position: "C",
    years: "1964-1974",
    teams: ["New York Knicks"],
    stats: { ppg: 18.7, rpg: 12.9, apg: 1.8, championships: 2, mvps: 1 },
    accolades: ["2x NBA Champion", "2x Finals MVP", "1x MVP", "7x All-Star"],
  },
  {
    rank: 65,
    name: "Nate Archibald",
    position: "PG",
    years: "1970-1984",
    teams: ["Royals/Kings", "Nets", "Celtics", "Bucks"],
    stats: { ppg: 18.8, rpg: 2.3, apg: 7.4, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "6x All-Star"],
  },
  {
    rank: 66,
    name: "Dave Cowens",
    position: "C",
    years: "1970-1983",
    teams: ["Boston Celtics", "Milwaukee Bucks"],
    stats: { ppg: 17.6, rpg: 13.6, apg: 3.8, championships: 2, mvps: 1 },
    accolades: ["2x NBA Champion", "1x MVP", "7x All-Star"],
  },
  {
    rank: 67,
    name: "Bob Cousy",
    position: "PG",
    years: "1950-1970",
    teams: ["Boston Celtics", "Cincinnati Royals"],
    stats: { ppg: 18.4, rpg: 5.2, apg: 7.5, championships: 6, mvps: 1 },
    accolades: ["6x NBA Champion", "1x MVP", "13x All-Star"],
  },
  {
    rank: 68,
    name: "Jaylen Brown",
    position: "SG/SF",
    years: "2016-Present",
    teams: ["Boston Celtics"],
    stats: { ppg: 19.9, rpg: 5.7, apg: 3.2, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "3x All-Star"],
  },
  {
    rank: 69,
    name: "Pau Gasol",
    position: "PF/C",
    years: "2001-2019",
    teams: ["Grizzlies", "Lakers", "Bulls", "Spurs", "Bucks"],
    stats: { ppg: 17.0, rpg: 9.2, apg: 3.2, championships: 2, mvps: 0 },
    accolades: ["2x NBA Champion", "6x All-Star"],
  },
  {
    rank: 70,
    name: "Tony Parker",
    position: "PG",
    years: "2001-2019",
    teams: ["San Antonio Spurs", "Charlotte Hornets"],
    stats: { ppg: 15.5, rpg: 2.7, apg: 5.6, championships: 4, mvps: 0 },
    accolades: ["4x NBA Champion", "1x Finals MVP", "6x All-Star"],
  },
  {
    rank: 71,
    name: "Manu Ginobili",
    position: "SG",
    years: "2002-2018",
    teams: ["San Antonio Spurs"],
    stats: { ppg: 13.3, rpg: 3.5, apg: 3.8, championships: 4, mvps: 0 },
    accolades: ["4x NBA Champion", "2x All-Star"],
  },
  {
    rank: 72,
    name: "Ben Wallace",
    position: "C",
    years: "1996-2012",
    teams: ["Bullets", "Magic", "Pistons", "Bulls", "Cavaliers"],
    stats: { ppg: 5.7, rpg: 9.6, apg: 1.3, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "4x DPOY", "4x All-Star"],
  },
  {
    rank: 73,
    name: "Dikembe Mutombo",
    position: "C",
    years: "1991-2009",
    teams: ["Nuggets", "Hawks", "76ers", "Nets", "Knicks", "Rockets"],
    stats: { ppg: 9.8, rpg: 10.3, apg: 0.4, championships: 0, mvps: 0 },
    accolades: ["4x DPOY", "8x All-Star"],
  },
  {
    rank: 74,
    name: "Robert Parish",
    position: "C",
    years: "1976-1997",
    teams: ["Warriors", "Celtics", "Hornets", "Bulls"],
    stats: { ppg: 14.5, rpg: 9.1, apg: 1.4, championships: 4, mvps: 0 },
    accolades: ["4x NBA Champion", "9x All-Star"],
  },
  {
    rank: 75,
    name: "Wes Unseld",
    position: "C",
    years: "1968-1981",
    teams: ["Baltimore/Washington Bullets"],
    stats: { ppg: 10.8, rpg: 14.0, apg: 3.9, championships: 1, mvps: 1 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "1x MVP", "5x All-Star"],
  },
  {
    rank: 76,
    name: "Pete Maravich",
    position: "SG",
    years: "1970-1980",
    teams: ["Hawks", "Jazz", "Celtics"],
    stats: { ppg: 24.2, rpg: 4.2, apg: 5.4, championships: 0, mvps: 0 },
    accolades: ["5x All-Star", "1x Scoring Champion"],
  },
  {
    rank: 77,
    name: "Bernard King",
    position: "SF",
    years: "1977-1993",
    teams: ["Nets", "Jazz", "Warriors", "Knicks", "Bullets"],
    stats: { ppg: 22.5, rpg: 5.8, apg: 3.3, championships: 0, mvps: 0 },
    accolades: ["4x All-Star", "1x Scoring Champion"],
  },
  {
    rank: 78,
    name: "Amare Stoudemire",
    position: "PF/C",
    years: "2002-2016",
    teams: ["Suns", "Knicks", "Mavericks", "Heat"],
    stats: { ppg: 18.9, rpg: 7.8, apg: 1.4, championships: 0, mvps: 0 },
    accolades: ["6x All-Star", "ROY"],
  },
  {
    rank: 79,
    name: "Yao Ming",
    position: "C",
    years: "2002-2011",
    teams: ["Houston Rockets"],
    stats: { ppg: 19.0, rpg: 9.2, apg: 1.6, championships: 0, mvps: 0 },
    accolades: ["8x All-Star"],
  },
  {
    rank: 80,
    name: "Sam Jones",
    position: "SG",
    years: "1957-1969",
    teams: ["Boston Celtics"],
    stats: { ppg: 17.7, rpg: 4.9, apg: 2.5, championships: 10, mvps: 0 },
    accolades: ["10x NBA Champion", "5x All-Star"],
  },
  {
    rank: 81,
    name: "Grant Hill",
    position: "SF",
    years: "1994-2013",
    teams: ["Pistons", "Magic", "Suns", "Clippers"],
    stats: { ppg: 16.7, rpg: 6.0, apg: 4.1, championships: 0, mvps: 0 },
    accolades: ["7x All-Star"],
  },
  {
    rank: 82,
    name: "Derrick Rose",
    position: "PG",
    years: "2008-2024",
    teams: ["Bulls", "Knicks", "Cavaliers", "Timberwolves", "Pistons", "Grizzlies"],
    stats: { ppg: 17.4, rpg: 3.2, apg: 5.6, championships: 0, mvps: 1 },
    accolades: ["1x MVP (youngest ever)", "3x All-Star"],
  },
  {
    rank: 83,
    name: "Tim Hardaway",
    position: "PG",
    years: "1989-2003",
    teams: ["Warriors", "Heat", "Mavericks", "Nuggets", "Pacers"],
    stats: { ppg: 17.7, rpg: 3.3, apg: 8.2, championships: 0, mvps: 0 },
    accolades: ["5x All-Star"],
  },
  {
    rank: 84,
    name: "Devin Booker",
    position: "SG",
    years: "2015-Present",
    teams: ["Phoenix Suns"],
    stats: { ppg: 24.8, rpg: 4.3, apg: 5.1, championships: 0, mvps: 0 },
    accolades: ["5x All-Star"],
  },
  {
    rank: 85,
    name: "Bob McAdoo",
    position: "C/PF",
    years: "1972-1986",
    teams: ["Braves", "Knicks", "Celtics", "Pistons", "Nets", "Lakers", "76ers"],
    stats: { ppg: 22.1, rpg: 9.4, apg: 2.3, championships: 2, mvps: 1 },
    accolades: ["2x NBA Champion", "1x MVP", "5x All-Star", "3x Scoring Champion"],
  },
  {
    rank: 86,
    name: "Bill Walton",
    position: "C",
    years: "1974-1987",
    teams: ["Trail Blazers", "Clippers", "Celtics"],
    stats: { ppg: 13.3, rpg: 10.5, apg: 3.4, championships: 2, mvps: 1 },
    accolades: ["2x NBA Champion", "1x Finals MVP", "1x MVP", "2x All-Star"],
  },
  {
    rank: 87,
    name: "Artis Gilmore",
    position: "C",
    years: "1971-1988",
    teams: ["Colonels", "Bulls", "Spurs", "Celtics"],
    stats: { ppg: 17.1, rpg: 10.1, apg: 2.3, championships: 0, mvps: 0 },
    accolades: ["6x All-Star"],
  },
  {
    rank: 88,
    name: "Chris Bosh",
    position: "PF/C",
    years: "2003-2016",
    teams: ["Raptors", "Heat"],
    stats: { ppg: 19.2, rpg: 8.5, apg: 2.0, championships: 2, mvps: 0 },
    accolades: ["2x NBA Champion", "11x All-Star"],
  },
  {
    rank: 89,
    name: "Chauncey Billups",
    position: "PG",
    years: "1997-2014",
    teams: ["Celtics", "Raptors", "Nuggets", "Timberwolves", "Pistons", "Knicks", "Clippers"],
    stats: { ppg: 15.2, rpg: 2.9, apg: 5.4, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "1x Finals MVP", "5x All-Star"],
  },
  {
    rank: 90,
    name: "LaMarcus Aldridge",
    position: "PF/C",
    years: "2006-2021",
    teams: ["Trail Blazers", "Spurs", "Nets"],
    stats: { ppg: 19.4, rpg: 8.2, apg: 2.0, championships: 0, mvps: 0 },
    accolades: ["7x All-Star"],
  },
  {
    rank: 91,
    name: "Elvin Hayes",
    position: "PF/C",
    years: "1968-1984",
    teams: ["Rockets", "Bullets"],
    stats: { ppg: 21.0, rpg: 12.5, apg: 1.8, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "12x All-Star"],
  },
  {
    rank: 92,
    name: "Dan Issel",
    position: "C/PF",
    years: "1970-1985",
    teams: ["Colonels", "Nuggets"],
    stats: { ppg: 20.4, rpg: 9.1, apg: 2.4, championships: 0, mvps: 0 },
    accolades: ["6x All-Star"],
  },
  {
    rank: 93,
    name: "Adrian Dantley",
    position: "SF",
    years: "1976-1991",
    teams: ["Braves", "Pacers", "Lakers", "Jazz", "Pistons", "Mavericks", "Bucks"],
    stats: { ppg: 24.3, rpg: 5.7, apg: 3.0, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "6x All-Star", "2x Scoring Champion"],
  },
  {
    rank: 94,
    name: "Shawn Kemp",
    position: "PF",
    years: "1989-2003",
    teams: ["Sonics", "Cavaliers", "Trail Blazers", "Magic"],
    stats: { ppg: 14.6, rpg: 8.4, apg: 1.6, championships: 0, mvps: 0 },
    accolades: ["6x All-Star"],
  },
  {
    rank: 95,
    name: "Alex English",
    position: "SF",
    years: "1976-1991",
    teams: ["Bucks", "Pacers", "Nuggets", "Mavericks"],
    stats: { ppg: 21.5, rpg: 5.5, apg: 3.6, championships: 0, mvps: 0 },
    accolades: ["8x All-Star", "1x Scoring Champion"],
  },
  {
    rank: 96,
    name: "Jack Sikma",
    position: "C",
    years: "1977-1991",
    teams: ["Seattle SuperSonics", "Milwaukee Bucks"],
    stats: { ppg: 15.6, rpg: 9.8, apg: 3.2, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "7x All-Star"],
  },
  {
    rank: 97,
    name: "Earl Monroe",
    position: "SG",
    years: "1967-1980",
    teams: ["Baltimore Bullets", "New York Knicks"],
    stats: { ppg: 18.8, rpg: 3.0, apg: 3.9, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "4x All-Star"],
  },
  {
    rank: 98,
    name: "Dave DeBusschere",
    position: "SF/PF",
    years: "1962-1974",
    teams: ["Detroit Pistons", "New York Knicks"],
    stats: { ppg: 16.1, rpg: 11.0, apg: 2.9, championships: 2, mvps: 0 },
    accolades: ["2x NBA Champion", "8x All-Star"],
  },
  {
    rank: 99,
    name: "Sidney Moncrief",
    position: "SG",
    years: "1979-1991",
    teams: ["Milwaukee Bucks", "Atlanta Hawks"],
    stats: { ppg: 15.6, rpg: 4.7, apg: 3.6, championships: 0, mvps: 0 },
    accolades: ["2x DPOY", "5x All-Star"],
  },
  {
    rank: 100,
    name: "Hal Greer",
    position: "SG",
    years: "1958-1973",
    teams: ["Syracuse Nationals", "Philadelphia 76ers"],
    stats: { ppg: 19.2, rpg: 5.0, apg: 4.0, championships: 1, mvps: 0 },
    accolades: ["1x NBA Champion", "10x All-Star"],
  },
];

export default function AllTimePage() {
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-warning" />
            <h1 className="text-4xl font-bold text-white">
              Top 100 All-Time
            </h1>
          </div>
          <p className="text-text-secondary max-w-2xl mx-auto">
            The greatest players in NBA history, ranked by career achievements,
            statistical dominance, and overall impact on the game.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning rounded-full" />
            <span className="text-sm text-text-secondary">5+ Championships</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-sm text-text-secondary">3+ MVPs</span>
          </div>
          <div className="flex items-center gap-2">
            <Medal className="w-4 h-4 text-accent-purple" />
            <span className="text-sm text-text-secondary">Finals MVP</span>
          </div>
        </div>

        {/* Players List */}
        <div className="space-y-4">
          {allTimeGreats.map((player, index) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                variant="interactive"
                className={cn(
                  "overflow-hidden",
                  expandedPlayer === player.rank && "border-primary/50"
                )}
                onClick={() =>
                  setExpandedPlayer(
                    expandedPlayer === player.rank ? null : player.rank
                  )
                }
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                        player.rank === 1
                          ? "bg-warning/20 text-warning"
                          : player.rank === 2
                          ? "bg-gray-400/20 text-gray-400"
                          : player.rank === 3
                          ? "bg-orange-600/20 text-orange-600"
                          : "bg-surface-elevated text-text-secondary"
                      )}
                    >
                      {player.rank}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{player.name}</h3>
                        <Badge variant="default" size="sm">
                          {player.position}
                        </Badge>
                        {player.stats.championships >= 5 && (
                          <Star className="w-4 h-4 text-warning fill-warning" />
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">
                        {player.years} • {player.teams.join(", ")}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="hidden sm:flex items-center gap-6">
                      <StatBadge label="PPG" value={player.stats.ppg} />
                      <StatBadge label="RPG" value={player.stats.rpg} />
                      <StatBadge label="APG" value={player.stats.apg} />
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-warning" />
                        <span className="font-bold">{player.stats.championships}</span>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <Button variant="ghost" size="sm">
                      {expandedPlayer === player.rank ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Content */}
                  {expandedPlayer === player.rank && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Career Stats */}
                        <div>
                          <h4 className="font-medium mb-3">Career Averages</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-surface-elevated rounded-lg p-3 text-center">
                              <p className="text-xl font-bold">{player.stats.ppg}</p>
                              <p className="text-xs text-text-muted">PPG</p>
                            </div>
                            <div className="bg-surface-elevated rounded-lg p-3 text-center">
                              <p className="text-xl font-bold">{player.stats.rpg}</p>
                              <p className="text-xs text-text-muted">RPG</p>
                            </div>
                            <div className="bg-surface-elevated rounded-lg p-3 text-center">
                              <p className="text-xl font-bold">{player.stats.apg}</p>
                              <p className="text-xs text-text-muted">APG</p>
                            </div>
                          </div>
                        </div>

                        {/* Accolades */}
                        <div>
                          <h4 className="font-medium mb-3">Accolades</h4>
                          <div className="flex flex-wrap gap-2">
                            {player.accolades.map((accolade, i) => (
                              <Badge key={i} variant="primary" size="sm">
                                {accolade}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

      </main>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-semibold">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

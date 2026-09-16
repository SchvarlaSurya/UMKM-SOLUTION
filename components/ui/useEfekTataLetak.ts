"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect yang aman dipakai komponen yang ikut dirender di server.
 *
 * React memperingatkan kalau useLayoutEffect dijalankan saat render server.
 * Di sana memang tidak ada yang perlu diukur, jadi efeknya turun jadi
 * useEffect yang tidak pernah berjalan.
 *
 * Dipakai animasi yang harus menulis keadaan awalnya sebelum paint: kalau
 * menunggu useEffect, nilai akhirnya sempat tergambar satu frame lebih dulu.
 */
export const useEfekTataLetak = typeof window === "undefined" ? useEffect : useLayoutEffect;

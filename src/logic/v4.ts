
export const M3u8ProxyV4 = async (request: Request<unknown>) => {
  const url = new URL(request.url);
  const refererUrl = decodeURIComponent(url.searchParams.get("referer") || "");
  const targetUrl = decodeURIComponent(url.searchParams.get("url") || "");
  const originUrl = decodeURIComponent(url.searchParams.get("origin") || "");
  const proxyAll = decodeURIComponent(url.searchParams.get("all") || "");

  if (!targetUrl) {
    return new Response("Invalid URL", { status: 400 });
  }

  const response = await fetch(targetUrl, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Referer: refererUrl || "",
      Origin: originUrl || "",
    },
  });
  const regex = /"[^"]*\.m3u8[^"]*"/g;
  let modifiedM3u8;
  if (targetUrl.includes(".m3u8")) {
    modifiedM3u8 = await response.text();
    const targetUrlTrimmed = `${encodeURIComponent(
      targetUrl.replace(/([^/]+\.m3u8)$/, "").trim()
    )}`;
    const encodedUrl = encodeURIComponent(refererUrl);
    const encodedOrigin = encodeURIComponent(originUrl);
    modifiedM3u8 = modifiedM3u8.split("\n").map((line) => {
      const matches: any = line.match(regex);
      // console.log(matches);
      if (matches?.length > 0) {
        // console.log({ matches });

        const oldText = matches?.[0];
        // console.log({ oldText });

        if (oldText.startsWith("http")) {
          line = line.replace(oldText, `"${url.origin}/m3u8-proxy/?url=${oldText}"`);
        } else {
          line = line.replace(
            oldText,
            `"/m3u8-proxy/?url=${targetUrlTrimmed}${oldText}${originUrl ? `&origin=${encodedOrigin}` : ""}${refererUrl ? `&referer=${encodedUrl}` : ""}"`
          );
        }

      }
      if (line.startsWith("#") || line.trim() == '') {
        return line;
      }
      else if (line.startsWith('http')) {
        return `${url.origin}/m3u8-proxy/?url=${line}`;
      }
      return `/m3u8-proxy/?url=${targetUrlTrimmed}${line}${originUrl ? `&origin=${encodedOrigin}` : ""
        }${refererUrl ? `&referer=${encodedUrl}` : ""
        }`;
    }).join("\n");
  }

  return new Response(modifiedM3u8 || response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type":
        response.headers?.get("Content-Type") ||
        "application/vnd.apple.mpegurl",
    },
  });
}
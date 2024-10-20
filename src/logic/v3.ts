

export const M3u8ProxyV3 = async (request: Request<unknown>) => {
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
      Referer: refererUrl || url || "",
      Origin: originUrl || url || "",
    },
  });

  let modifiedM3u8;
  if (targetUrl.includes(".m3u8")) {
    modifiedM3u8 = await response.text();
    const targetUrlTrimmed = `${encodeURIComponent(
      targetUrl.replace(/([^/]+\.m3u8)$/, "").trim()
    )}`;
    const encodedUrl = encodeURIComponent(refererUrl);
    const encodedOrigin = encodeURIComponent(originUrl);
    const specialUrl = targetUrl?.split("/").map((ele: any) => {
      if (ele?.includes(".m3u8")) { }
      else return ele;
    }).join("/");
    modifiedM3u8 = modifiedM3u8.split("\n").map((line) => {
      if (line?.includes("http")) {
        // console.log({ line });
        const newLine = line?.replaceAll("http", "?url=http");
        return newLine;
      }
      else if (line.startsWith("#") || line.trim() == '') {
        return line;
      }
      if ((line?.includes(".jpg") || line?.includes(".png") || line?.includes(".jpeg")) && !(line?.includes('http')) || (line?.includes("./"))) {
        return `?url=${specialUrl}/${line?.replace("./", "")}`;
      }
      return line;
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
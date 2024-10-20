

export const M3u8ProxyPcmirror = async (request: Request<unknown>) => {
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
      Referer: refererUrl || "https://pcmirror.cc",
      Origin: originUrl || "https://pcmirror.cc",
    },
  });

  let modifiedM3u8;
  if (targetUrl.includes(".m3u8")) {
    modifiedM3u8 = await response.text();
    // console.log({ modifiedM3u8 });
    const targetUrlTrimmed = `${encodeURIComponent(
      targetUrl.replace(/([^/]+\.m3u8)$/, "").trim()
    )}`;
    // console.log({ targetUrlTrimmed });

    const encodedUrl = encodeURIComponent(refererUrl);
    const encodedOrigin = encodeURIComponent(originUrl);
    modifiedM3u8 = modifiedM3u8.split("\n").map((line) => {
      // console.log({ line });
      if (line?.includes("#EXT-X-MEDIA")) {
        return line?.replace("https://", "?url=https://")
      }
      else if (line?.startsWith("#") || line.trim() == '') {
        return line;
      }
      else if (proxyAll == 'yes' && line.startsWith('http')) { //https://yourproxy.com/?url=https://somevideo.m3u8&all=yes
        return `${url.origin}/pcmirror?url=${line}`;
      }
      if (targetUrlTrimmed?.includes("pcmirror.cc")) {
        return `?url=${line}${originUrl ? `&origin=${encodedOrigin}` : ""
          }${refererUrl ? `&referer=${encodedUrl}` : ""
          }`;
      }
      else return `?url=${targetUrlTrimmed}${line}${originUrl ? `&origin=${encodedOrigin}` : ""
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
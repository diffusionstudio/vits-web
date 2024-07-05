import { ProgressCallback } from "./types";

export async function fetchBlob(url: string, callback?: ProgressCallback): Promise<Blob> {
  return await new Promise((resolve) => {
    let xContentLength: number;
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onprogress = event => {
      callback?.({
        url,
        total: xContentLength ?? event.total,
        loaded: event.loaded
      })
    }

    xhr.onreadystatechange = () => {
      if (
        xhr.readyState >= xhr.HEADERS_RECEIVED
        && xContentLength == undefined
        && xhr.getAllResponseHeaders().includes("x-content-length")
      ) {
        xContentLength = Number(xhr.getResponseHeader("x-content-length"));
      }

      if (xhr.readyState === xhr.DONE) {
        callback?.({
          url,
          total: xContentLength,
          loaded: xContentLength
        })
        resolve(xhr.response);
      }
    }
    xhr.open("GET", url);
    xhr.send();
  })
};

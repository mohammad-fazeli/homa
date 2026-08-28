import { net, protocol } from "electron";
import { pathToFileURL } from "url";
import { parsePhotoRequestUrl, PHOTO_SCHEME } from "../../shared/photos";
import { absolutePhotoPath } from "./photo-files";

export function registerPhotoScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PHOTO_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        bypassCSP: true,
      },
    },
  ]);
}

export function registerPhotoProtocol() {
  protocol.handle(PHOTO_SCHEME, (request) => {
    const parsed = parsePhotoRequestUrl(request.url);
    if (!parsed) return new Response("Not Found", { status: 404 });
    const file = absolutePhotoPath(parsed.kind, parsed.id);
    if (!file) return new Response("Not Found", { status: 404 });
    return net.fetch(pathToFileURL(file).href);
  });
}

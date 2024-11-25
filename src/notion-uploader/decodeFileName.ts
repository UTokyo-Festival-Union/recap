export const decodeFileName = (fileName: string) =>
  decodeURIComponent(`%${fileName.match(/.{2}/g)?.join("%") ?? ""}`);

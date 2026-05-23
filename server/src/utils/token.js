import crypto from "crypto";

export const generateToken = (size = 32) =>
  crypto.randomBytes(size).toString("hex");

export default generateToken;

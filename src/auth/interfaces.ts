export interface LogInInfo {
  email: string;
  password: string;
}
export interface TokenPayload {
  sub: string;
  email: string;
}

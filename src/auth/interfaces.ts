export interface LogInInfo {
  email: string;
  password: string;
}
export interface TokenPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'BUSINESS_OWNER' | 'USER';
  iat: number;
  exp: number;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
}

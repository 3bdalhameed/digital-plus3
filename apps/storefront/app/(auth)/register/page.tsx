import { redirect } from "next/navigation";

/**
 * Registration is now merged into the login page: the OTP flow
 * auto-creates a verified user on first successful code entry, so
 * there's no separate signup step. Any old link or bookmark to
 * /register just lands on /login where the same email input serves
 * both new and returning users.
 */
export default function RegisterPage() {
  redirect("/login");
}

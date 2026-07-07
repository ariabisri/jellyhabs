import { redirect } from "next/navigation";

export default function Home() {
  // Langsung mengarahkan (redirect) pengguna ke halaman dashboard.
  redirect("/dashboard");
}

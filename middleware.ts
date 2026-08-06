import { NextResponse, type NextRequest } from "next/server"
import { DEMO_COOKIE, isDemoParamAllowed } from "@/lib/demo-flags"

// Jedyne zadanie: zamienić `?demo=1` na ciasteczko `lb_demo`, żeby tryb demo
// przeżył nawigację ORAZ client-side fetch do `/api/tips` (przełącznik daty
// na /typy, kalendarz w /kupony).
//
// `?demo=0` wyłącza. Bez parametru `demo` middleware nie robi NIC — zwykły
// ruch produkcyjny przechodzi bez zmian.

export function middleware(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("demo")
  if (param == null) return NextResponse.next()

  const res = NextResponse.next()
  // req.headers.get("host") (nagłówek żądania), NIE req.nextUrl.hostname —
  // to drugie potrafi nie odzwierciedlać realnego Hosta (np. na gołym
  // `next start` bez proxy zwraca adres bindu, nie to, co faktycznie
  // wysłał klient), zweryfikowane bezpośrednio przed tą zmianą.
  if (!isDemoParamAllowed(req.headers.get("host"))) return res

  if (param === "0" || param === "false") {
    res.cookies.delete(DEMO_COOKIE)
  } else {
    res.cookies.set(DEMO_COOKIE, "1", {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 h — sesja testowa, nie na stałe
    })
  }
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
}

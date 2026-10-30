import { Link, useLocation, useNavigate } from "react-router";
import { Mark } from "../../components/brand/BrandMark";
import { LoginForm } from "../../components/auth/LoginForm";
import { useTranslation } from "../../hooks/useTranslation";
import { readNextParam, signupPath } from "../../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const next = readNextParam(location.search);

  return (
    <div className="grid gap-12 py-4 md:min-h-[68vh] md:grid-cols-2 md:items-center md:gap-16 md:py-10">
      <section className="max-w-md">
        <Mark size="md" />
        <h1 className="mt-8 text-4xl leading-[1.08] md:text-5xl">{t("home.hero.title")}</h1>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
          {t("home.hero.subtitle")}
        </p>
      </section>

      <section className="w-full max-w-md border border-border p-6 md:justify-self-end md:p-8">
        <h2>{t("login.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("login.description")}</p>

        <div className="mt-8">
          <LoginForm onSuccess={() => navigate(next ?? "/", { replace: true })} autoFocus />
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link
            to={signupPath(next)}
            className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
          >
            {t("login.signupLink")}
          </Link>
        </p>
      </section>
    </div>
  );
}

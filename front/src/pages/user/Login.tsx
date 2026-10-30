import { Link, useLocation, useNavigate } from "react-router";
import { Mark } from "../../components/brand/BrandMark";
import { LoginForm } from "../../components/auth/LoginForm";
import { useTranslation } from "../../hooks/useTranslation";
import { readNextParam, signupPath } from "../../utils/auth";

/** One narrow column, centred: the way a store's account page opens. */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const next = readNextParam(location.search);

  return (
    <div className="flex justify-center py-4 md:min-h-[64vh] md:items-center md:py-10">
      <section className="w-full max-w-md">
        <div className="flex justify-center">
          <Mark size="md" />
        </div>
        <h1 className="page-title mt-8 text-center">{t("login.title")}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t("login.description")}</p>

        <div className="mt-8">
          <LoginForm onSuccess={() => navigate(next ?? "/", { replace: true })} autoFocus />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
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

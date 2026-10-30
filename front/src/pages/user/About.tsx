import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { LinkStartBar } from "../../components/landing/LinkStartBar";
import { api } from "../../utils/api";
import { useTranslation } from "../../hooks/useTranslation";

type FeeRate = { feeRatePercent: number | string };

/** How the service works, what it costs, and how to reach us. Reads the fee from the server. */
export default function About() {
  const { t } = useTranslation();
  const [feePercent, setFeePercent] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<FeeRate>("/v1/settings/fee-rate")
      .then((res) => {
        const value = res.data?.feeRatePercent;
        setFeePercent(value == null ? null : String(value));
      })
      .catch(() => setFeePercent(null));
  }, []);

  const steps = [1, 2, 3].map((n) => ({
    n,
    title: t(`landing.how.${n}.title`),
    description: t(`landing.how.${n}.desc`),
  }));
  const facts = ["rate", "escrow", "chat", "track"] as const;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{t("landing.hero.eyebrow")}</p>
      <h1 className="page-title mt-4 text-center">{t("about.title")}</h1>
      <p className="mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-muted-foreground">{t("about.intro")}</p>

      {/* The sequence */}
      <section className="mt-16 border-t border-foreground pt-8">
        <h2 className="store-title text-left">{t("landing.how.title")}</h2>
        <ol className="mt-8 space-y-6">
          {steps.map((step) => (
            <li key={step.n} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-b border-border pb-6">
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground figure">0{step.n}</span>
              <div>
                <h3 className="text-lg font-light leading-snug">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Cost */}
      <section className="mt-16 border-t border-foreground pt-8">
        <h2 className="store-title text-left">{t("about.fees.title")}</h2>
        <dl className="mt-8 divide-y divide-border border-b border-border">
          <div className="grid gap-1 py-4 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6">
            <dt className="text-sm text-muted-foreground">{t("about.fees.commission")}</dt>
            <dd className="text-sm">
              {feePercent != null ? (
                <span className="figure">{t("about.fees.commissionValue", { n: feePercent })}</span>
              ) : (
                t("about.fees.commissionUnknown")
              )}
              <span className="mt-1 block text-xs text-muted-foreground">{t("about.fees.commissionNote")}</span>
            </dd>
          </div>
          <div className="grid gap-1 py-4 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6">
            <dt className="text-sm text-muted-foreground">{t("about.fees.payment")}</dt>
            <dd className="text-sm">{t("about.fees.paymentValue")}</dd>
          </div>
          <div className="grid gap-1 py-4 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6">
            <dt className="text-sm text-muted-foreground">{t("about.fees.shipping")}</dt>
            <dd className="text-sm">{t("about.fees.shippingValue")}</dd>
          </div>
        </dl>
      </section>

      {/* What you get */}
      <section className="mt-16 border-t border-foreground pt-8">
        <h2 className="store-title text-left">{t("landing.why.title")}</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {facts.map((key) => (
            <li key={key} className="border-t border-border pt-4">
              <h3 className="text-sm font-medium">{t(`landing.why.${key}.title`)}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`landing.why.${key}.desc`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Contact */}
      <section className="mt-16 border-t border-foreground pt-8">
        <h2 className="store-title text-left">{t("footer.inquiry")}</h2>
        <p className="mt-6 text-sm text-muted-foreground">{t("footer.hours")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/notice">{t("nav.notice")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/inquiry/new">{t("landing.services.inquiry.action")}</Link>
          </Button>
        </div>
      </section>

      <section className="mt-16 border-t border-foreground pt-10">
        <p className="eyebrow text-muted-foreground">{t("home.link.title")}</p>
        <LinkStartBar className="mt-3" />
      </section>
    </div>
  );
}

import { useTranslation } from '../hooks/useTranslation';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t('app.title')}</h2>
    </div>
  );
}

import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 ps-6 text-sm leading-relaxed text-slate-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  )
}

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm leading-relaxed text-slate-600">{children}</p>
)

export function PrivacyPolicy() {
  const { t, tList } = useI18n()
  usePageMeta(t('privacyPolicyTitle'))
  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{t('privacyPolicyTitle')}</h1>
      <P>{t('effectiveDate')}</P>
      <Section title={t('privacyIntroTitle')}>
        <P>{t('privacyIntro')}</P>
      </Section>
      <Section title={t('infoCollectTitle')}>
        <h3 className="text-base font-medium text-slate-800">{t('infoProvidedTitle')}</h3>
        <List items={tList('infoProvidedList')} />
        <h3 className="text-base font-medium text-slate-800">{t('infoAutoTitle')}</h3>
        <List items={tList('infoAutoList')} />
      </Section>
      <Section title={t('howWeUseTitle')}>
        <List items={tList('howWeUseList')} />
      </Section>
      <Section title={t('contactUsTitle')}>
        <P>{t('contactUsText')}</P>
        <P>{t('contactEmail')}</P>
        <P>
          {t('contactLinkedIn')}{' '}
          <a href="https://www.linkedin.com/in/leon-melamud" target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800">
            Leon Melamud
          </a>
        </P>
      </Section>
    </div>
  )
}

export function TermsOfService() {
  const { t, tList } = useI18n()
  usePageMeta(t('termsOfServiceTitle'))
  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{t('termsOfServiceTitle')}</h1>
      <P>{t('effectiveDate')}</P>
      <Section title={t('tosAcceptanceTitle')}>
        <P>{t('tosAcceptanceText')}</P>
      </Section>
      <Section title={t('tosPermittedTitle')}>
        <P>{t('tosPermittedText')}</P>
        <List items={tList('tosPermittedList')} />
      </Section>
      <Section title={t('tosProhibitedTitle')}>
        <P>{t('tosProhibitedText')}</P>
        <List items={tList('tosProhibitedList')} />
      </Section>
      <Section title={t('tosContactTitle')}>
        <P>{t('tosContactText')}</P>
        <P>{t('tosContactEmail')}</P>
      </Section>
    </div>
  )
}

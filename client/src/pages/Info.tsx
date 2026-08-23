import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../lib/usePageMeta'

const REPO = 'https://github.com/LeonMelamud/AI-Knowledge'
const LINKEDIN = 'https://www.linkedin.com/in/leon-melamud'

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm leading-relaxed text-ink-muted">{children}</p>
)

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 ps-6 text-sm leading-relaxed text-ink-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

const External = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="underline hover:text-ink">
    {children}
  </a>
)

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 border border-hairline bg-surface-raised p-8">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      {children}
    </div>
  )
}

export function About() {
  const { t, tList } = useI18n()
  usePageMeta(t('aboutTitle'))
  return (
    <Card title={t('aboutTitle')}>
      <P>{t('aboutIntro')}</P>
      <Section title={t('aboutWhatTitle')}>
        <P>{t('aboutWhat')}</P>
      </Section>
      <Section title={t('aboutWhoTitle')}>
        <P>{t('aboutWho')}</P>
      </Section>
      <Section title={t('aboutHowTitle')}>
        <P>{t('aboutHow')}</P>
        <P>
          <External href={REPO}>github.com/LeonMelamud/AI-Knowledge</External>
        </P>
      </Section>
      <Section title={t('aboutStanceTitle')}>
        <List items={tList('aboutStanceList')} />
      </Section>
      <P>
        <Link to="/contact" className="underline hover:text-ink">
          {t('contactTitle')}
        </Link>
      </P>
    </Card>
  )
}

export function Contact() {
  const { t } = useI18n()
  usePageMeta(t('contactTitle'))
  return (
    <Card title={t('contactTitle')}>
      <P>{t('contactIntro')}</P>
      <Section title={t('contactChannelsTitle')}>
        <ul className="list-disc space-y-2 ps-6 text-sm leading-relaxed text-ink-muted">
          <li>
            {t('contactIssues')} <External href={`${REPO}/issues`}>{`${REPO}/issues`}</External>
          </li>
          <li>
            {t('contactEdit')} <External href={REPO}>github.com/LeonMelamud/AI-Knowledge</External>
          </li>
          <li>
            {t('contactOther')} <External href={LINKEDIN}>linkedin.com/in/leon-melamud</External>
          </li>
        </ul>
      </Section>
      <Section title={t('contactExpectTitle')}>
        <P>{t('contactExpect')}</P>
      </Section>
      <P>
        <Link to="/privacy-policy" className="underline hover:text-ink">
          {t('privacyPolicy')}
        </Link>
        {' · '}
        <Link to="/terms-of-service" className="underline hover:text-ink">
          {t('termsOfService')}
        </Link>
        {' · '}
        <Link to="/about" className="underline hover:text-ink">
          {t('aboutTitle')}
        </Link>
      </P>
    </Card>
  )
}

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Lang = 'en' | 'es';

const dict = {
  en: {
    nav_github: 'GitHub',
    footer_tagline: 'Built in the open, by builders for builders.',
    footer_cursor: 'Cursor',
    footer_source: 'Source',
    hero_eyebrow: 'Open source · Opt-in',
    hero_title: "See who's building with Cursor.",
    hero_subtitle_1: 'A community ranking powered by public profile stats from ',
    hero_subtitle_2: '. Add your handle to join — only public profiles appear.',
    join_label: 'Join the leaderboard',
    handle_placeholder: 'your-cursor-handle',
    btn_add: 'Add me',
    btn_adding: 'Adding…',
    err_not_public: 'Profile not found or not public',
    err_generic: 'Something went wrong',
    err_load: 'Could not load ranking',
    join_hint_1: 'Your profile must be public at ',
    join_hint_2: '. Stats refresh daily.',
    section_rankings: 'Rankings',
    sort_tokens: 'Tokens',
    sort_agents: 'Agents',
    sort_streak: 'Streak',
    sort_best: 'Best streak',
    th_user: 'User',
    th_tokens: 'Tokens',
    th_agents: 'Agents',
    th_streak: 'Streak',
    th_best: 'Best',
    th_model: 'Top model',
    empty: 'No one yet. Be the first — add your handle above.',
    sort_label: 'Sort by',
    stats_title: 'Community stats',
    stat_users: 'Builders',
    stat_tokens: 'Total tokens',
    stat_agents: 'Total agents',
    stat_avg_streak: 'Avg streak',
    chart_title: 'Top 5',
    models_title: 'Popular models',
  },
  es: {
    nav_github: 'GitHub',
    footer_tagline: 'Hecho en abierto, por y para quienes construyen con Cursor.',
    footer_cursor: 'Cursor',
    footer_source: 'Código',
    hero_eyebrow: 'Código abierto · Opcional',
    hero_title: 'Mira quién está construyendo con Cursor.',
    hero_subtitle_1:
      'Un ranking de la comunidad con stats de perfiles públicos de ',
    hero_subtitle_2:
      '. Agrega tu handle para unirte — solo aparecen perfiles públicos.',
    join_label: 'Únete al ranking',
    handle_placeholder: 'tu-handle-de-cursor',
    btn_add: 'Agregarme',
    btn_adding: 'Agregando…',
    err_not_public: 'Perfil no encontrado o no público',
    err_generic: 'Algo salió mal',
    err_load: 'No se pudo cargar el ranking',
    join_hint_1: 'Tu perfil debe ser público en ',
    join_hint_2: '. Las stats se actualizan a diario.',
    section_rankings: 'Ranking',
    sort_tokens: 'Tokens',
    sort_agents: 'Agentes',
    sort_streak: 'Racha',
    sort_best: 'Mejor racha',
    th_user: 'Usuario',
    th_tokens: 'Tokens',
    th_agents: 'Agentes',
    th_streak: 'Racha',
    th_best: 'Mejor',
    th_model: 'Modelo top',
    empty: 'Nadie aún. Sé el primero — agrega tu handle arriba.',
    sort_label: 'Ordenar por',
    stats_title: 'Stats de la comunidad',
    stat_users: 'Builders',
    stat_tokens: 'Tokens totales',
    stat_agents: 'Agentes totales',
    stat_avg_streak: 'Racha prom.',
    chart_title: 'Top 5',
    models_title: 'Modelos populares',
  },
} as const;

export type TKey = keyof (typeof dict)['en'];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string };

const I18nContext = createContext<Ctx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => dict.en[k],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    const nav = navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
    setLang(saved ?? nav);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: (k) => dict[lang][k] ?? dict.en[k] }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext);

export function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <button
      type="button"
      className="lang-toggle"
      onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
      aria-label={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
    >
      {lang === 'en' ? 'ES' : 'EN'}
    </button>
  );
}

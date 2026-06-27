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
    hero_eyebrow: 'Open source',
    hero_title: "See who's building with Cursor.",
    hero_subtitle_1: 'A community ranking powered by public profile stats from ',
    hero_subtitle_2: '. Add your handle to join.',
    join_label: 'Join the leaderboard',
    handle_placeholder: 'your-cursor-handle',
    btn_add: 'Add me',
    btn_adding: 'Adding…',
    err_invalid_handle: 'Invalid handle',
    err_invalid_handle_hint: 'Use only letters, numbers, underscores and hyphens (max 40 characters).',
    err_profile_unavailable: 'Profile not found or set to private',
    err_profile_unavailable_hint:
      'Check the handle at cursor.com/@handle. If it exists, open Cursor → Settings → Profile and set it to public.',
    err_cursor_unavailable: 'Could not reach Cursor right now',
    err_cursor_unavailable_hint: 'Cursor may be down or rate-limiting. Try again in a few minutes.',
    err_server: 'Server error',
    err_network: 'Could not connect to the server',
    err_network_hint: 'Check your connection, or that the API is running locally.',
    err_load: 'Could not load the leaderboard',
    err_generic: 'Something went wrong',
    btn_retry: 'Try again',
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
    pulse_title: 'Community pulse',
    pulse_builders: 'Builders',
    pulse_tokens: 'Total tokens',
    pulse_agents: 'Total agents',
    pulse_new: 'New this week',
    podium_title: 'Top builders',
    recent_title: 'Recently joined',
    anon_label: 'Appear anonymously',
    anon_hint: 'Stats stay visible; your name, avatar and handle are hidden.',
    anon_name: 'Anonymous',
    anon_active: 'You appear anonymously on the board.',
    btn_rank: 'Where am I?',
    btn_rank_checking: 'Checking…',
    rank_found: 'Your rank',
    rank_not_found: 'Not on the leaderboard yet',
    rank_not_found_hint:
      'This handle is not registered here. If your Cursor profile is private, make it public first, then add your handle above.',
    rank_you: 'You',
  },
  es: {
    nav_github: 'GitHub',
    footer_tagline: 'Hecho en abierto, por y para quienes construyen con Cursor.',
    footer_cursor: 'Cursor',
    footer_source: 'Código',
    hero_eyebrow: 'Código abierto',
    hero_title: 'Mira quién está construyendo con Cursor.',
    hero_subtitle_1:
      'Un ranking de la comunidad con stats de perfiles públicos de ',
    hero_subtitle_2: '. Agrega tu handle para unirte.',
    join_label: 'Únete al ranking',
    handle_placeholder: 'tu-handle-de-cursor',
    btn_add: 'Agregarme',
    btn_adding: 'Agregando…',
    err_invalid_handle: 'Handle inválido',
    err_invalid_handle_hint: 'Solo letras, números, guiones y _ (máx. 40 caracteres).',
    err_profile_unavailable: 'Perfil no encontrado o privado',
    err_profile_unavailable_hint:
      'Revisa el handle en cursor.com/@handle. Si existe, ve a Cursor → Settings → Profile y ponlo en público.',
    err_cursor_unavailable: 'No pudimos conectar con Cursor',
    err_cursor_unavailable_hint: 'Cursor puede estar caído o limitando requests. Intenta en unos minutos.',
    err_server: 'Error del servidor',
    err_network: 'No se pudo conectar al servidor',
    err_network_hint: 'Revisa tu conexión o que la API esté corriendo en local.',
    err_load: 'No se pudo cargar el ranking',
    err_generic: 'Algo salió mal',
    btn_retry: 'Reintentar',
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
    pulse_title: 'Pulso de la comunidad',
    pulse_builders: 'Builders',
    pulse_tokens: 'Tokens totales',
    pulse_agents: 'Agentes totales',
    pulse_new: 'Nuevos esta semana',
    podium_title: 'Top builders',
    recent_title: 'Se unieron recientemente',
    anon_label: 'Aparecer en anónimo',
    anon_hint: 'Tus stats se ven; nombre, avatar y handle quedan ocultos.',
    anon_name: 'Anónimo',
    anon_active: 'Apareces en anónimo en el ranking.',
    btn_rank: '¿En qué puesto estoy?',
    btn_rank_checking: 'Buscando…',
    rank_found: 'Tu posición',
    rank_not_found: 'Aún no estás en el ranking',
    rank_not_found_hint:
      'Este handle no está registrado aquí. Si tu perfil de Cursor es privado, ponlo público y agrégalo arriba.',
    rank_you: 'Tú',
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

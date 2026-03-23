import axios, { AxiosResponse } from "axios";
import PQueue from "p-queue";
import NodeCache from "node-cache";

export const END_POINT_42API = "https://api.intra.42.fr";

const apiCache = new NodeCache();
const _queue = new PQueue({
  interval: 1000,
  intervalCap: process.env.NODE_ENV === "production" ? 6 : 6,
  throwOnTimeout: true,
});

export const queue = {
  add: <T>(fn: () => Promise<T>) => _queue.add(fn) as Promise<T>,
  onIdle: () => _queue.onIdle(),
};

export const axiosClientFor42 = axios.create({
  baseURL: END_POINT_42API,
});

const axiosClientFor42Pagenation = async <Data = any, Params = any>(
  url: string,
  params?: Partial<PageParams> & Partial<Params>
) => {
  const res = await axiosClientFor42.get<Data>(url, {
    params: params && {
      ...params,
      "page[number]": params["page[number]"] ? params["page[number]"] : 1,
      "page[size]": params["page[size]"] ? params["page[size]"] : 100,
    },
  });
  return res as AxiosResponse<Data, any> & {
    headers: PageHeader;
  };
};

let tokenPromise: Promise<string> | null = null;
async function ensureToken(): Promise<string> {
  const cached = apiCache.get<string>("token");
  if (cached) return cached;
  if (!tokenPromise) {
    tokenPromise = get42OauthToken().then(({ data: t }) => {
      const ttl = Math.max(t.created_at + t.expires_in - Math.floor(Date.now() / 1000), 60);
      apiCache.set("token", t.access_token, ttl);
      tokenPromise = null;
      return t.access_token;
    }).catch((err) => {
      tokenPromise = null;
      throw err;
    });
  }
  return tokenPromise;
}

axiosClientFor42.interceptors.request.use(
  async (config) => {
    const access_token = await ensureToken();
    config.headers.set("Authorization", `Bearer ${access_token}`);
    config.headers.set("Accept", "application/json");
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClientFor42.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;
    if (error.response?.status === 429) {
      const retries = originalRequest._retryCount ?? 0;
      if (retries < 5) {
        originalRequest._retryCount = retries + 1;
        const retryAfter = parseInt(error.response.headers["retry-after"] ?? "2", 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return axios(originalRequest);
      }
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      apiCache.del("token");
      const access_token = await ensureToken();
      originalRequest.headers["Authorization"] = "Bearer " + access_token;
      return axios(originalRequest);
    }
    return Promise.reject(error);
  }
);

type PageParams = {
  "page[number]": number;
  "page[size]": number;
};

type PageHeader = {
  "x-per-page": string;
  "x-page": string;
  "x-total": string;
};

export type User = UserBase & {
  groups: [];
  cursus_users: CursusUser[];
  projects_users: ProjectUser[];
  languages_users: [];
  achievements: Achievement[];
  titles: Title[];
  titles_users: TitleUser[];
  partnerships: [];
  patroned: [];
  patroning: [];
  expertises_users: [];
  roles: [];
  campus: Campus[];
  campus_users: CampusUser[];
};

type UserBase = {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  usual_full_name: string;
  usual_first_name: string;
  url: string;
  phone: string;
  displayname: string;
  image_url: string;
  new_image_url: string;
  image?: {
    link?: string;
    versions?: {
      large?: string;
      medium?: string;
      small?: string;
      micro?: string;
    };
  };
  "staff?": boolean;
  correction_point: number;
  pool_month: string;
  pool_year: string;
  location?: string;
  wallet: number;
  anonymize_date: string;
  created_at: string;
  updated_at: string;
  alumni: boolean;
  "is_launched?": boolean;
};

type Skill = {
  id: number;
  name: string;
  level: number;
};

type Cursus = {
  id: number;
  created_at: string;
  name: string;
  slug: string;
};

type CursusUser = {
  id: number;
  grade?: string;
  level: number;
  skills: Skill[];
  blackholed_at?: string;
  begin_at: string;
  end_at?: string;
  cursus_id: number;
  has_coalition: boolean;
  created_at: string;
  updated_at: string;
  user: UserBase;
  cursus: Cursus;
};

export type ProjectUser = {
  id: number;
  occurrence: number;
  final_mark?: number;
  status: string;
  "validated?"?: boolean;
  current_team_id?: number;
  project: Project;
  cursus_ids: number[];
  marked_at?: string;
  marked: boolean;
  retriable_at?: string;
  created_at: string;
  updated_at: string;
};

type Project = {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
};

type Achievement = {
  id: number;
  name: string;
  description: string;
  tier: string;
  kind: string;
  visible: boolean;
  image?: string;
  nbr_of_success?: number;
  users_url: string;
  parent?: Achievement;
  achievements: string[];
};

type Title = {
  id: number;
  /**
   * Substituting the string corresponding to `%login` and using it.
   */
  name: string;
};

type TitleUser = {
  id: number;
  user_id: number;
  title_id: number;
  selected: boolean;
  created_at: string;
  updated_at: string;
};

type Campus = {
  id: number;
  name: string;
  time_zone: string;
  language: Language & {
    created_at: string;
    updated_at: string;
  };
  users_count: number;
  vogsphere_id?: number;
  country: string;
  address: string;
  zip: string;
  city: string;
  website: string;
  facebook: string;
  twitter: string;
  active: boolean;
  email_extension?: string;
  default_hidden_phone: boolean;
};

type Language = {
  id: number;
  name: string;
  identifier: string;
};

type CampusUser = {
  id: number;
  user_id: number;
  campus_id: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type Coalition = {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  cover_url?: string;
  color: string;
  score: number;
  user_id: number;
};

type Get42OauthToken = {
  access_token: string;
  expires_in: number;
  created_at: number;
};

export const get42OauthToken = () => {
  return axios.post<Get42OauthToken>(`${END_POINT_42API}/oauth/token`, {
    grant_type: "client_credentials",
    client_id: process.env.FORTY_TWO_CLIENT_ID,
    client_secret: process.env.FORTY_TWO_CLIENT_SECRET,
  });
};

export const get42User = (id: string | number) => {
  return queue.add(() => axiosClientFor42Pagenation<User>(`/v2/users/${id}`));
};

export const get42UserCoalition = async (id: string | number) => {
  return queue.add(() =>
    axiosClientFor42Pagenation<Coalition[]>(`/v2/users/${id}/coalitions`)
  );
};

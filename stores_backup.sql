--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deliveries (
    id integer NOT NULL,
    code text NOT NULL,
    item text NOT NULL,
    description text,
    quantity integer NOT NULL,
    units text NOT NULL,
    date_sent text NOT NULL,
    time_sent text NOT NULL,
    driver text NOT NULL,
    "authorization" text NOT NULL,
    vehicle_no text NOT NULL,
    store_id text NOT NULL,
    received text NOT NULL,
    from_store_id text,
    to_store_id text
);


ALTER TABLE public.deliveries OWNER TO postgres;

--
-- Name: deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deliveries_id_seq OWNER TO postgres;

--
-- Name: deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deliveries_id_seq OWNED BY public.deliveries.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    code text NOT NULL,
    item text NOT NULL,
    description text,
    quantity integer NOT NULL,
    units text NOT NULL,
    date_in text NOT NULL,
    store_id text NOT NULL
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_id_seq OWNER TO postgres;

--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    item_name text,
    code text,
    description text,
    quantity integer,
    units text,
    date_ordered text,
    status text,
    store_id text,
    from_store_id character varying(255),
    to_store_id character varying(255),
    status_updated boolean DEFAULT false
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    email text NOT NULL,
    otp text NOT NULL,
    expiry timestamp without time zone NOT NULL
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- Name: stores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stores (
    store_id text NOT NULL,
    email text NOT NULL,
    created_at text NOT NULL
);


ALTER TABLE public.stores OWNER TO postgres;

--
-- Name: stores_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stores_backup (
    store_id text,
    created_at text
);


ALTER TABLE public.stores_backup OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    email text NOT NULL,
    store_id text NOT NULL,
    role text,
    status text DEFAULT 'pending'::text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_backup (
    email text,
    store_id text,
    role text,
    status text
);


ALTER TABLE public.users_backup OWNER TO postgres;

--
-- Name: utilize; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilize (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    store_id character varying(50) NOT NULL,
    quantity integer NOT NULL,
    units character varying(50) NOT NULL,
    comments text NOT NULL,
    date_utilized timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.utilize OWNER TO postgres;

--
-- Name: utilize_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utilize_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilize_id_seq OWNER TO postgres;

--
-- Name: utilize_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utilize_id_seq OWNED BY public.utilize.id;


--
-- Name: deliveries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries ALTER COLUMN id SET DEFAULT nextval('public.deliveries_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: utilize id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilize ALTER COLUMN id SET DEFAULT nextval('public.utilize_id_seq'::regclass);


--
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deliveries (id, code, item, description, quantity, units, date_sent, time_sent, driver, "authorization", vehicle_no, store_id, received, from_store_id, to_store_id) FROM stdin;
15	8888	filler	gyproc filler	70	bags	2024-12-28	22:49	sammy	joe	KAM 160W	kiambu	no	vcc	kiambu
16	8888	filler	gyproc filler	40	bags	2024-12-28	23:05	sammy	joe	KAM 160W	vcc	no	vcc	kiambu
17	A111	shoes	size 42	40	pairs 	2024-12-28	23:12	eve	adam	KAM 160W	vcc	yes	vcc	kiambu
21	8888	filler	gyproc filler	100	bags	2024-12-29	08:51	zthu6a4	tjggrhjur	KAM 160W	kiambu	yes	kiambu	vcc
4	8888	filler	gyproc filler	5	bags	2024-12-27	08:11	james 	sam	KAM 160W	vcc	yes	vcc	kiambu
5	8888	filler	gyproc filler	5	bags	2024-12-27	12:30	sammy	sam	KAM 160W	kiambu	yes	vcc	kiambu
24	gumboot001	gumboots	no 10	5	pairs	2024-12-30	15:13	Name: james odero \r\nPhone No: 07456668559\r\nId: 15789456	Name: Marther \r\nPhone No: 0728456789\r\nId: 28956422	KAW 198E	vcc	yes	vcc	kiambu
30	4578 D	nails	brass nails	10	bags	2024-12-31	12:42	huihlknfd	ehfioewhfn	KAW 198E	kiambu	yes	kiambu	vcc
22	8888	filler	gyproc filler	25	bags	2024-12-29	08:52	tdtydyufui	de56e67t	KAM 160W	kiambu	yes	kiambu	vcc
18	8888	filler	gyproc filler	100	bags	2024-12-29	00:01	gchjvb	nu76r7uigh	KAM 160W	kiambu	yes	kiambu	vcc
31	4578 D	nails	brass nails	10	bags	2024-12-31	13:07	yugighil	fdytfui	KAW 198E	vcc	no	kiambu	vcc
14	8888	filler	gyproc filler	10	bags	2024-12-28	21:53	sammy	june 	KAM 160W	kiambu	yes	vcc	kiambu
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (id, code, item, description, quantity, units, date_in, store_id) FROM stdin;
7	4578 loresho	nails	ordinary	12	kgs	2024-12-17	loresho
8	4575	nails	ordinary nails	2	kgs	2024-12-17	loresho
9	4578	nails	ordinary nails	5	bags	2024-12-17	loresho
12	8888	filler	gyproc filler	12	bags	2024-12-24	NYARI
45	111	paint brush	4", 4", 4", 4"	100	pcs	2024-12-31 12:58:19.105405+03	vcc
15	111	paint brush	4"	10	pcs	2024-12-26	NYARI
47	01111	gumboots	no 10	1	pairs	2024-12-31 12:58:22.64159+03	vcc
30	A111	shoes	size 42, size 42, size 42, size 42	105	pairs 	2024-12-31 12:58:48.675013+03	vcc
11	8888	filler	gyproc filler, gyproc filler, gyproc filler	393	bags	2024-12-31 12:58:53.914351+03	vcc
44	4578 D	nails	brass nails	0	bags	2024-12-31 12:58:06.679322+03	vcc
13	4578 D	nails	brass nails	6	bags	2024-12-25	kiambu
1	4578	nails	ordinary nails	35	bags	2024-12-14	kiambu
10	8888	filler	gyproc filler, gyproc filler, gyproc filler	5	bags	2025-01-01 10:39:34.514442+03	kiambu
54	0004	brush	4" paint brush	2	No	2025-01-20	kiambu
42	gumboot001	gumboots	no 10	5	pairs	2024-12-30	vcc
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, item_name, code, description, quantity, units, date_ordered, status, store_id, from_store_id, to_store_id, status_updated) FROM stdin;
4	filler	filler 0001	gyproc filler 	20	bags 	2024-12-26	waiting	kiambu	\N	\N	f
6	helmets	H001	yellow	18	pcs	2024-12-26	waiting	kiambu	\N	\N	f
7	helmets	H001	yellow 	18	pcs	2024-12-26	waiting	kiambu	Kiambu	loresho	f
11	spirit level	001	new 	18	pcs	2024-12-27	waiting	vcc	vcc	kiambu	f
12	nails	n001	ordinary 	15	kgs	2024-12-27	waiting	vcc	vcc	kiambu	f
13	nails	001	steel nails 	11	pks 	2024-12-27	Confirmed	vcc	vcc	kiambu	f
10	helmets	H001	white	18	pcs	2024-12-27	Confirmed	kiambu	\N	\N	f
15	gumboots	gumboot001	4yergfd	3	pairs	2024-12-31	Pending	vcc	vcc	kiambu	f
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (email, otp, expiry) FROM stdin;
ari.gram.technologies@gmail.com	143131	2025-01-01 12:44:04.77
samsonkips2000@gmail.com	800970	2025-01-20 15:24:44.108
\.


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stores (store_id, email, created_at) FROM stdin;
admin	samsonkips2000@gmail.com	2024-12-13T18:35:30.329Z
kiambu	samsonkips2000@gmail.com	2024-12-14T05:20:22.759Z
vcc	samsonkips2000@gmail.com	2024-12-23T19:46:53.825Z
NYARI	ari.gram.technologies@gmail.com	2024-12-24T10:02:01.813Z
wari	ari.gram.technologies@gmail.com	2024-12-25T08:08:37.554Z
loresho	ari.gram.technologies@gmail.com	2024-12-16T20:57:34.368Z
complex	samsonkips2000@gmail.com	2024-12-31T20:19:56.500Z
\.


--
-- Data for Name: stores_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stores_backup (store_id, created_at) FROM stdin;
loresho	2024-12-13 18:00:27
admin	2024-12-13T18:35:30.329Z
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (email, store_id, role, status) FROM stdin;
samsonkips2000@gmail.com	kiambu	store keeper	approved
samsonkips2000@gmail.com	vcc	store keeper	approved
samsonkips2000@gmail.com	complex	store keeper	approved
ari.gram.technologies@gmail.com	kiambu	admin	approved
ari.gram.technologies@gmail.com	vcc	admin	approved
ari.gram.technologies@gmail.com	complex	admin	approved
samsonkips2000@gmail.com	admin	admin	approved
\.


--
-- Data for Name: users_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_backup (email, store_id, role, status) FROM stdin;
samsonkips2000@gmail.com	admin	admin	approved
ari.gram.technologies@gmail.com	loresho	store keeper	approved
\.


--
-- Data for Name: utilize; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilize (id, code, store_id, quantity, units, comments, date_utilized) FROM stdin;
1	4578 B	kiambu	10	pkts	ground floor masking.\r\n	2024-12-29 13:59:23.139824
2	111	kiambu	5	pcs	painting the first floor	2024-12-29 19:00:36.200314
3	A111	kiambu	10	pairs 	fore mman	2024-12-29 19:01:26.167698
4	4578 B	kiambu	14	pkts	first floor	2024-12-30 09:46:04.85428
5	01111	kiambu	2	pairs 	used by two new painters.	2024-12-30 15:08:18.611056
8	0004	kiambu	10	No	painting the first floor	2025-01-20 15:43:29.093033
\.


--
-- Name: deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deliveries_id_seq', 31, true);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_id_seq', 54, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 15, true);


--
-- Name: utilize_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilize_id_seq', 8, true);


--
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_code_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_code_store_id_key UNIQUE (code, store_id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (email);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (store_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (email, store_id);


--
-- Name: utilize utilize_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilize
    ADD CONSTRAINT utilize_pkey PRIMARY KEY (id);


--
-- Name: deliveries deliveries_code_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_code_store_id_fkey FOREIGN KEY (code, store_id) REFERENCES public.inventory(code, store_id) ON DELETE CASCADE;


--
-- Name: inventory inventory_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- PostgreSQL database dump complete
--


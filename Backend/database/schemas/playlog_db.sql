--
-- PostgreSQL database dump
--

\restrict BrOonUBXpHouw8xW9RIiwrHzUn9zY6b9Qi3997WBfFAwdhXfK9mn5UR8IpAsGjt

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: game_external_ids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_external_ids (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    game_id uuid NOT NULL,
    source character varying(30) NOT NULL,
    external_id character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: game_genres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_genres (
    game_id uuid NOT NULL,
    genre_id uuid NOT NULL
);


--
-- Name: game_localizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_localizations (
    game_id uuid NOT NULL,
    locale character varying(10) NOT NULL,
    name character varying(255),
    summary text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source character varying(30)
);


--
-- Name: game_platforms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_platforms (
    game_id uuid NOT NULL,
    platform_id uuid NOT NULL
);


--
-- Name: games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(200) NOT NULL,
    name character varying(255) NOT NULL,
    summary text,
    cover_image_id character varying(100),
    first_release_date timestamp with time zone,
    developer_name character varying(255),
    publisher_name character varying(255),
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT games_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'HIDDEN'::character varying])::text[])))
);


--
-- Name: genres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.genres (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: platforms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platforms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    abbreviation character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_user_id uuid NOT NULL,
    display_name character varying(50) NOT NULL,
    avatar_url text,
    bio character varying(500),
    banner_url text,
    game_library_public boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    game_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating numeric(2,1) NOT NULL,
    content character varying(5000),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_range CHECK (((rating >= 0.5) AND (rating <= 5.0) AND (mod(rating, 0.5) = (0)::numeric)))
);

--
-- Name: user_game_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_game_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    game_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_game_statuses_status_check CHECK (((status)::text = ANY ((ARRAY['wishlist'::character varying, 'playing'::character varying, 'completed'::character varying, 'paused'::character varying, 'dropped'::character varying])::text[])))
);


--
-- Name: game_external_ids game_external_ids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_external_ids
    ADD CONSTRAINT game_external_ids_pkey PRIMARY KEY (id);


--
-- Name: game_genres game_genres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_genres
    ADD CONSTRAINT game_genres_pkey PRIMARY KEY (game_id, genre_id);


--
-- Name: game_localizations game_localizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_localizations
    ADD CONSTRAINT game_localizations_pkey PRIMARY KEY (game_id, locale);


--
-- Name: game_platforms game_platforms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_platforms
    ADD CONSTRAINT game_platforms_pkey PRIMARY KEY (game_id, platform_id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: games games_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_slug_key UNIQUE (slug);

--
-- Name: user_game_statuses user_game_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_statuses
    ADD CONSTRAINT user_game_statuses_pkey PRIMARY KEY (id);

--
-- Name: user_game_statuses user_game_statuses_user_game_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_statuses
    ADD CONSTRAINT user_game_statuses_user_game_unique UNIQUE (user_id, game_id);


--
-- Name: genres genres_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_name_key UNIQUE (name);


--
-- Name: genres genres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_pkey PRIMARY KEY (id);


--
-- Name: platforms platforms_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_name_key UNIQUE (name);


--
-- Name: platforms platforms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_account_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_account_user_id_key UNIQUE (account_user_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_user_game_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_game_unique UNIQUE (user_id, game_id);


--
-- Name: game_external_ids uq_game_external_source; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_external_ids
    ADD CONSTRAINT uq_game_external_source UNIQUE (source, external_id);


--
-- Name: idx_game_external_ids_game_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_external_ids_game_id ON public.game_external_ids USING btree (game_id);


--
-- Name: idx_games_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_games_name ON public.games USING btree (name);


--
-- Name: reviews_game_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_game_created_at_idx ON public.reviews USING btree (game_id, created_at DESC);


--
-- Name: reviews_game_rating_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_game_rating_idx ON public.reviews USING btree (game_id, rating);

--
-- Name: user_game_statuses_user_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_game_statuses_user_updated_at_idx ON public.user_game_statuses USING btree (user_id, updated_at DESC);


--
-- Name: game_localizations trg_game_localizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_game_localizations_updated_at BEFORE UPDATE ON public.game_localizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: games trg_games_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles trg_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: game_external_ids fk_game_external_ids_game; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_external_ids
    ADD CONSTRAINT fk_game_external_ids_game FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: game_genres fk_game_genres_game; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_genres
    ADD CONSTRAINT fk_game_genres_game FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: game_genres fk_game_genres_genre; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_genres
    ADD CONSTRAINT fk_game_genres_genre FOREIGN KEY (genre_id) REFERENCES public.genres(id) ON DELETE CASCADE;


--
-- Name: game_localizations fk_game_localizations_game; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_localizations
    ADD CONSTRAINT fk_game_localizations_game FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: game_platforms fk_game_platforms_game; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_platforms
    ADD CONSTRAINT fk_game_platforms_game FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: game_platforms fk_game_platforms_platform; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_platforms
    ADD CONSTRAINT fk_game_platforms_platform FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE RESTRICT;

--
-- Name: user_game_statuses user_game_statuses_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_statuses
    ADD CONSTRAINT user_game_statuses_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict BrOonUBXpHouw8xW9RIiwrHzUn9zY6b9Qi3997WBfFAwdhXfK9mn5UR8IpAsGjt

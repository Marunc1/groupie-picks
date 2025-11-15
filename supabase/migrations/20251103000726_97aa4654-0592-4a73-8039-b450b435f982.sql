-- Create tournaments table
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_stage_enabled boolean NOT NULL DEFAULT true,
  knockout_stage_enabled boolean NOT NULL DEFAULT true,
  group_stage_locked boolean NOT NULL DEFAULT false,
  knockout_stage_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  logo text,
  seed integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create group_teams table (many-to-many between groups and teams)
CREATE TABLE public.group_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  is_advancing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, team_id)
);

-- Create matches table (for bracket/knockout stage)
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  round text NOT NULL, -- 'ro16', 'quarters', 'semis', 'final'
  match_number integer NOT NULL,
  team1_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  team2_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  winner_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_picks table (for viewers' predictions)
CREATE TABLE public.user_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(username, tournament_id)
);

-- Create user_group_picks (predictions for group stage)
CREATE TABLE public.user_group_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pick_id uuid REFERENCES public.user_picks(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_pick_id, group_id, team_id)
);

-- Create user_match_picks (predictions for knockout stage)
CREATE TABLE public.user_match_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pick_id uuid REFERENCES public.user_picks(id) ON DELETE CASCADE NOT NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  picked_team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_pick_id, match_id)
);

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');

-- Create user_roles table for admin authentication
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_match_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
      AND role = 'admin'
  )
$$;

-- RLS Policies for public read access (viewers can see everything)
CREATE POLICY "Everyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Everyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Everyone can view groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Everyone can view group_teams" ON public.group_teams FOR SELECT USING (true);
CREATE POLICY "Everyone can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Everyone can view user_picks" ON public.user_picks FOR SELECT USING (true);
CREATE POLICY "Everyone can view user_group_picks" ON public.user_group_picks FOR SELECT USING (true);
CREATE POLICY "Everyone can view user_match_picks" ON public.user_match_picks FOR SELECT USING (true);

-- RLS Policies for admin write access
CREATE POLICY "Admins can insert tournaments" ON public.tournaments FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update tournaments" ON public.tournaments FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete tournaments" ON public.tournaments FOR DELETE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert teams" ON public.teams FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update teams" ON public.teams FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert groups" ON public.groups FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update groups" ON public.groups FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete groups" ON public.groups FOR DELETE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert group_teams" ON public.group_teams FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update group_teams" ON public.group_teams FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete group_teams" ON public.group_teams FOR DELETE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies for user picks (anyone can create/update their own picks)
CREATE POLICY "Anyone can insert user_picks" ON public.user_picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_picks" ON public.user_picks FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert user_group_picks" ON public.user_group_picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_group_picks" ON public.user_group_picks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete user_group_picks" ON public.user_group_picks FOR DELETE USING (true);

CREATE POLICY "Anyone can insert user_match_picks" ON public.user_match_picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_match_picks" ON public.user_match_picks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete user_match_picks" ON public.user_match_picks FOR DELETE USING (true);

-- RLS Policies for user_roles (only admins can manage roles)
CREATE POLICY "Admins can view user_roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert user_roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete user_roles" ON public.user_roles FOR DELETE USING (public.is_admin(auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tournaments table
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_teams_tournament_id ON public.teams(tournament_id);
CREATE INDEX idx_groups_tournament_id ON public.groups(tournament_id);
CREATE INDEX idx_group_teams_group_id ON public.group_teams(group_id);
CREATE INDEX idx_group_teams_team_id ON public.group_teams(team_id);
CREATE INDEX idx_matches_tournament_id ON public.matches(tournament_id);
CREATE INDEX idx_user_picks_tournament_id ON public.user_picks(tournament_id);
CREATE INDEX idx_user_picks_username ON public.user_picks(username);
CREATE INDEX idx_user_group_picks_user_pick_id ON public.user_group_picks(user_pick_id);
CREATE INDEX idx_user_match_picks_user_pick_id ON public.user_match_picks(user_pick_id);
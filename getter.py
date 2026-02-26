import sqlite3 as sq
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn_string = os.environ.get("DB_CONNECTION_STRING")
conn = psycopg2.connect(conn_string)
cursor = conn.cursor()


def get_team_players(team):
    cursor.execute('''
                    SELECT 
                    players.id, players.name, players.riot_ID, players.rank 
                    FROM players JOIN teams ON teams.id = players.default_team_id 
                    where teams.tag = %s
    ''',(team,))
    rows = cursor.fetchall()
    return rows
def get_players_stats(players, z = None):
    for i in players:
        if z is None:
            z = {} # Create a fresh dictionary every time the function is called
        cursor.execute('''
                        WITH AgentCounts AS (
                        SELECT agent, COUNT(*) as freq
                        FROM match_stats_map
                        WHERE player_id = %s
                        GROUP BY agent
                        ORDER BY freq DESC
                        LIMIT 1
                        )
                        SELECT 
                        AVG(acs) AS avg_acs, 
                        SUM(kills) * 1.0 / NULLIF(SUM(deaths), 0) AS kd_ratio, 
                        (SELECT agent FROM AgentCounts) AS most_played_agent,
                        AVG(adr) AS avg_adr,
                        AVG(kast) AS avg_kast,
                        AVG(hs_pct) AS avg_hs,
                        SUM(fk) AS total_fk,
                        SUM(fd) AS total_fd
                        FROM match_stats_map
                        WHERE player_id = %s
        ''',(i[0],i[0],))
        z[i[1]] = cursor.fetchall()
        for player_name in z:
            z[player_name] = list(z[player_name])
    
    return z
def get_team_stats(team):
    cursor.execute('''
                    SELECT teams.id, matches.id, winner_id
                    FROM matches 
                    JOIN teams ON matches.team1_id = teams.id OR matches.team2_id = teams.id 
                    WHERE teams.tag = %s
    ''',(team, ))
    matches = cursor.fetchall()
    for i in range(len(matches)):
        matches[i] = [matches[i][0], matches[i][1], matches[i][2]]
    maps_played = []
    for i in matches:
        cursor.execute('''
                        SELECT map_name FROM match_maps WHERE match_id = %s
        ''',(i[1], ))
        x = cursor.fetchall()
        if len(x) > 0:
            maps_played.append(x)
        else:
            maps_played.append("forfeit")
    for i in range(len(maps_played)):
        maps_played[i] = list(maps_played[i][0])
    team_id = matches[0][0]
    u= len(matches)
    s = {}
    for i in range(u):
        if matches[i][0] == matches[i][2]:
            s[matches[i][1]] = [maps_played[i][0], "winner"]
        else:
            s[matches[i][1]] = [maps_played[i][0], "Loser"]
    maps_id = [i for i in s]
    placeholders = ', '.join(['%s'] * len(maps_played))
    query = f"SELECT AVG(acs), AVG(kills)/AVG(deaths) FROM match_stats_map WHERE match_id in ({placeholders})"
    cursor.execute(query, maps_id)
    r = cursor.fetchall()
    r = list(r[0])
    avrg = [round(r[0], 2), round(r[1], 2)]
    return s, maps_id, avrg
def get_map_avg_win(team_map_wins):    
    maps_played = [team_map_wins[i][0] for i in team_map_wins]
    maps_WL = [team_map_wins[i] for i in team_map_wins]
    map_p = {}
    for e in maps_played:
        if e not in map_p:
            map_p[e] = [0, 0]
        map_p[e][0] += 1
    for e in maps_WL:
        if e[1] == "winner":
            map_p[e[0]][1] += 1
    map_avg = {}
    for e in map_p:
        map_avg[e] = str((map_p[e][1]/map_p[e][0])*100)+'%'
    return map_avg

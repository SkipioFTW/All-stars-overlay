from getter import get_players_stats
import json
from pathlib import Path
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    conn_string = os.environ.get("DB_CONNECTION_STRING")
    return psycopg2.connect(conn_string)

def get_player_data(cursor, player_name):
    query = """
    SELECT id, name, riot_ID, rank 
    FROM players 
    WHERE name = %s OR name = %s OR name = %s
    """
    # Try with @ and without
    search_names = [player_name, player_name.replace('@', ''), '@' + player_name.replace('@', '')]
    cursor.execute(query, (search_names[0], search_names[1], search_names[2]))
    return cursor.fetchone()

def compile_allstars():
    selection_path = Path("allstars_selection.json")
    if not selection_path.exists():
        print("Error: allstars_selection.json not found.")
        return

    with open(selection_path, "r") as f:
        teams_config = json.load(f)

    conn = get_db_connection()
    cursor = conn.cursor()
    
    allstars_data = {}

    for team_name, player_names in teams_config.items():
        print(f"Processing team: {team_name}...")
        team_players = []
        for name in player_names:
            p_data = get_player_data(cursor, name)
            if p_data:
                team_players.append(p_data)
            else:
                print(f"  Warning: Player '{name}' not found in database.")

        if not team_players:
            print(f"  No players found for team {team_name}. Skipping.")
            continue

        # Get stats for these players
        # get_players_stats takes a list of (id, name, riot_id, rank)
        stats_dict = get_players_stats(team_players)
        
        formatted_players = {}
        total_adr = 0
        total_kast = 0
        total_fk = 0
        total_fd = 0
        count = 0

        for p_id, p_name, p_riot, p_rank in team_players:
            if p_name in stats_dict:
                s = stats_dict[p_name][0]
                formatted_players[p_name] = {
                    "Riot Id": p_riot,
                    "Rank": p_rank,
                    "Average ACS": s[0],
                    "Average K/D": s[1],
                    "Most Played Agent": s[2],
                    "Average ADR": s[3],
                    "Average KAST": s[4],
                    "Average HS%": s[5],
                    "First Kills": s[6],
                    "First Deaths": s[7]
                }
                if s[3] is not None: total_adr += s[3]
                if s[4] is not None: total_kast += s[4]
                if s[6] is not None: total_fk += s[6]
                if s[7] is not None: total_fd += s[7]
                count += 1

        allstars_data[team_name] = {
            "team_name": team_name,
            "players": formatted_players,
            "averages": {
                "avg_adr": total_adr / count if count > 0 else 0,
                "avg_kast": total_kast / count if count > 0 else 0,
                "avg_fk_success": (total_fk / (total_fk + total_fd)) * 100 if (total_fk + total_fd) > 0 else 0
            }
        }

    # Save to data/allstars.json
    output_dir = Path("data")
    output_dir.mkdir(exist_ok=True)
    output_path = output_dir / "allstars.json"
    
    with open(output_path, "w") as f:
        json.dump(allstars_data, f, indent=4, default=float)
    
    print(f"Successfully compiled allstars data to {output_path}")
    conn.close()

if __name__ == "__main__":
    compile_allstars()

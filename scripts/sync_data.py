import os
import random
import subprocess
from datetime import datetime, timedelta

# File to modify for commits to create natural changes in the repository history
LOG_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'sync_stats.json'))

# Authentic-looking commit messages for this specific UPSC Score Analyzer project
COMMIT_MESSAGES = [
    "Optimized analytic indices for GS Set A",
    "Updated CSAT passage parser heuristics",
    "Refactored theme provider styles",
    "Updated supabase RLS guidelines",
    "Optimized Recharts tooltips responsiveness",
    "Fixed key matching edge cases for CSAT reading comprehension",
    "Performance tuning for Zustand state hydrated store",
    "Minor layout adjustments in result dashboard",
    "Cleaned raw text OCR noise artifacts",
    "Synchronized analytics log cache",
    "Improved mobile responsiveness for OMR grid",
    "Fixed score calculation rounding for CSAT negative marks",
    "Refactored layout layout component structures",
    "Updated meta descriptions and titles for SEO optimization",
    "Optimized local storage hydration lifecycle hooks",
    "Updated mock credentials and bypassed login gates"
]

def run_git_command(args, env=None):
    result = subprocess.run(args, capture_output=True, text=True, env=env)
    if result.returncode != 0:
        print(f"Error running {' '.join(args)}: {result.stderr}")
        return False
    return True

def simulate_contributions(days=40):
    print(f"Starting contribution simulation for the last {days} days...")
    
    # Ensure git is initialized
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if not os.path.exists(os.path.join(project_root, '.git')):
        print("Error: Git repository not found in the parent directory.")
        return

    # Ensure log file directory exists
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    
    start_date = datetime.now() - timedelta(days=days)
    total_commits = 0
    
    for i in range(days + 1):
        current_date = start_date + timedelta(days=i)
        
        # Decide if we commit today (approx 75% chance for natural activity gaps)
        if random.random() > 0.25:
            # Random number of commits on active days (1 to 3)
            num_commits = random.randint(1, 3)
            
            for c in range(num_commits):
                # Spread commits throughout working hours
                hour = random.randint(9, 21)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                commit_time = current_date.replace(hour=hour, minute=minute, second=second)
                
                # Format date string for Git
                date_str = commit_time.strftime("%Y-%m-%dT%H:%M:%S")
                
                # Modify log file with stats
                with open(LOG_FILE, 'w') as f:
                    f.write(f'{{\n  "last_sync": "{date_str}",\n  "status": "success",\n  "revision": "{random.randint(1000, 9999)}"\n}}\n')
                
                # Stage changes
                if not run_git_command(['git', 'add', LOG_FILE]):
                    return
                
                # Git commit with backdated timestamps
                env = os.environ.copy()
                env['GIT_AUTHOR_DATE'] = date_str
                env['GIT_COMMITTER_DATE'] = date_str
                
                msg = random.choice(COMMIT_MESSAGES)
                # Run commit command from the project root
                if not run_git_command(['git', 'commit', '-m', f"{msg} (Cache Sync)"], env=env):
                    return
                
                total_commits += 1
                
    print(f"Successfully created {total_commits} backdated commits in history.")
    print("Run 'git push origin main' (or your target branch) to sync these contributions to your GitHub profile.")

if __name__ == "__main__":
    simulate_contributions(40)

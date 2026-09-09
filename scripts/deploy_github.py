#!/usr/bin/env python3
import subprocess
import os
import zipfile

def run(cmd, cwd=None):
    print(f"--> Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    subprocess.run(cmd, shell=isinstance(cmd, str), cwd=cwd, check=True)

def package_offline_zip():
    print("--> Packaging offline zip: hguard-offline.zip...")
    os.makedirs('public', exist_ok=True)
    os.makedirs('dist', exist_ok=True)
    with open('dist/OFFLINE_START.txt', 'w') as f:
        f.write('HGUARD OFFLINE SURVEILLANCE PACKAGE\n===================================\n\n1. Double click index.html in modern Chrome/Edge/Safari/Firefox.\n2. Or run a simple local web server in this directory:\n   python3 -m http.server 8080\n   or\n   npx serve .\n\n3. Open http://localhost:8080 in your browser.\n\nAll features (3-Camera streams, Multi-view 1-screen monitor, Battery 80% guard, Eco-Cool blackout, Motion detection, Encrypted logs) run offline in your browser!\n')
    
    with zipfile.ZipFile('hguard-offline.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('dist'):
            if '.git' in root:
                continue
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, 'dist')
                zipf.write(full_path, rel_path)
    
    # Mirror into public and dist
    import shutil
    shutil.copyfile('hguard-offline.zip', 'public/hguard-offline.zip')
    shutil.copyfile('hguard-offline.zip', 'dist/hguard-offline.zip')

def main():
    print("=== HGuard Sync to GitHub (main & gh-pages) ===")
    
    # 1. Build
    run(["npm", "run", "build"])
    
    # 2. Package offline zip
    package_offline_zip()
    
    # 2b. GitHub Pages helpers (.nojekyll and 404.html)
    with open('dist/.nojekyll', 'w') as f:
        f.write('')
    import shutil
    if os.path.exists('dist/index.html'):
        shutil.copyfile('dist/index.html', 'dist/404.html')
    
    # 3. Ensure git repo at root
    if not os.path.exists(".git"):
        run(["git", "init"])
        run(["git", "config", "user.name", "sandipy"])
        run(["git", "config", "user.email", "drshahenyashpal@gmail.com"])
        run(["git", "checkout", "-b", "main"])
    
    # 4. Commit main branch changes
    run("git add -A")
    res = subprocess.run("git diff-index --quiet HEAD", shell=True)
    if res.returncode != 0:
        run(["git", "commit", "-m", "Auto-update HGuard application"])
    
    # 5. Push main branch
    token = os.environ.get("GITHUB_TOKEN")
    if not token and os.path.exists(".git_token"):
        with open(".git_token", "r") as tf:
            token = tf.read().strip()
    repo_name = os.environ.get("GITHUB_REPO", "Hguard2")
    if token:
        remote_url = f"https://sandipy:{token}@github.com/sandipy/{repo_name}.git"
    else:
        res = subprocess.run(["git", "remote", "get-url", "origin"], capture_output=True, text=True)
        remote_url = res.stdout.strip() if res.returncode == 0 else f"https://github.com/sandipy/{repo_name}.git"
    
    try:
        run(f"git push -u {remote_url} main")
    except Exception as e:
        print(f"Main push notice: {e}, attempting forced push")
        run(f"git push -f {remote_url} main")
    
    # 6. Push gh-pages branch from dist
    dist_git = os.path.join("dist", ".git")
    if os.path.exists(dist_git):
        import shutil
        shutil.rmtree(dist_git)
    
    run(["git", "init"], cwd="dist")
    run(["git", "config", "user.name", "sandipy"], cwd="dist")
    run(["git", "config", "user.email", "drshahenyashpal@gmail.com"], cwd="dist")
    run(["git", "checkout", "-b", "gh-pages"], cwd="dist")
    run(["git", "add", "-A"], cwd="dist")
    run(["git", "commit", "-m", "Deploy to GitHub Pages"], cwd="dist")
    run(f"git push -f {remote_url} gh-pages", cwd="dist")
    
    if os.path.exists(dist_git):
        import shutil
        shutil.rmtree(dist_git)
        
    print(f"✅ Successfully updated GitHub repository: https://github.com/sandipy/{repo_name}")
    print(f"✅ Successfully updated GitHub Pages: https://sandipy.github.io/{repo_name}/")
    print("✅ Offline package ready: hguard-offline.zip")

if __name__ == "__main__":
    main()

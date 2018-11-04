from subprocess import call
call('sudo apt-get update && sudo apt-get install -y libxrender-dev && sudo apt-get install -y libsm6 libxext6', shell=True)

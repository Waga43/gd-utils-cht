#!/bin/bash
echo
echo -e "\033[1;32m===== <<gdutils project one-click deployment script "TG robot">> =====\033[0m"
echo -e "\033[1;32m----------------[ v2.1 by oneking ]----------------\033[0m"
echo -e "\033[32m 01.\033[0m This script is a one-click deployment script for the "TG robot" part of the gdutils project of TG; 大神@viegg; "
echo -e "\033[32m 02.\033[0m Preparation work 1: TD query and transfer part of gdutils project is completed; "
echo -e "\033[32m 03.\033[0m Preparation work 2: Register the robot on TG to obtain and record the robot TOKEN "
echo -e "\033[32m 04.\033[0m Preparation three: Have a domain name bound to cloudflare resolve to the IP of the server where the robot is located "
echo -e "\033[32m 05.\033[0m Preparation 4: Get personal TG account ID from robot@userinfobot and record "
echo -e "\033[32m 06.\033[0m Preparation 5: Register a Google team drive to join sa and record the disk ID "
echo -e "\033[32m 07.\033[0m This script is suitable for CentOS/Debian/Ubuntu three operating systems, automatic identification, automatic matching of parameters and one-click deployment "
echo -e "\033[32m 08.\033[0m Because this script involves more dependent software, to avoid interruption, it is recommended to use the screen window to install "
echo -e "\033[32m 09.\033[0m can be tested to install the system perfectly: Centos 7/8 debian 9/10 ubuntu 16.04/18.04/19.10/20.04 "
echo -e "\033[32m 10.\033[0m If you have any problems during the deployment process, please send the "error screenshot" and "deploy VPS system name version" information to TG: onekings or vitaminor@gmail.com "
echo -e "\033[1;32m---------------------------------------- --------\033[0m "
read -s -n1 -p " ★★★ If you have already prepared [2/3/4/5/6] above, please press any key to start deployment, if you are not ready, please press "Ctrl+c" to terminate deployment ★ ★★ "
echo
echo -e "\033[1;32m---------------------------------------- --------\033[0m "

# Identify the operating system
aNAME="$(uname -a)"
bNAME="$(cat /proc/version)"
cNAME="$(lsb_release -a)"
if [ -f "/etc/redhat-release" ]; then
    if [[ $(cat /etc/redhat-release) =~ "CentOS" ]]; then
        os="CentOS"
    fi
elif [ "$aNAME"=~"Debian" -o "$bNAME"=~"Debian" -o "$cNAME"=~"Debian" ]; then
    os="Debian"
elif [ "$aNAME"=~"Ubuntu" -o "$bNAME"=~"Ubuntu" -o "$cNAME"=~"Ubuntu" ]; then
    os="Debian"
elif [ "$aNAME"=~"CentOS" -o "$bNAME"=~"CentOS" -o "$cNAME"=~"CentOS" ]; then
    os="CentOS"
elif [ "$aNAME"=~"Darwin" -o "$bNAME"=~"Darwin" -o "$cNAME"=~"Darwin" ]; then
    os="mac"
else
    os="$bNAME"
fi

#Set variables according to operating system
if [[ "$os" = "Debian" ]]; then
    cmd_install="apt-get"                                     #install command
    nginx_conf="/etc/nginx/sites-enabled/"                    #nginx configuration file storage path
    rm_nginx_default="rm -f /etc/nginx/sites-enabled/default" #delete default
    echo
    echo -e "\033[1;32m★★★★★ Your operating system is Debian, and will soon begin the automatic deployment of the "TG robot" part of the gdutils project for you ★★★★★\033[0m"
elif [[ "$os" = "Ubuntu" ]]; then
    cmd_install="sudo apt-get"
    nginx_conf="/etc/nginx/sites-enabled/"
    rm_nginx_default="rm -f /etc/nginx/sites-enabled/default"
    echo
    echo -e "\033[1;32m★★★★★ Your operating system is Ubuntu, which will soon start the automatic deployment of the "TG robot" part of the gdutils project for you  ★★★★★\033[0m"
elif [[ "$os" = "CentOS" ]]; then
    cmd_install="yum"
    nginx_conf="/etc/nginx/conf.d/"
    rm_nginx_default=""
    echo
    echo -e "\033[1;32m★★★★★ Your operating system is Centos, which will soon start the automatic deployment of the "TG robot" part of the gdutils project for you ★★★★★\033[0m"
elif [[ "$os" = "mac" ]]; then
    echo
    echo -e "\033[1;32m★★★★★ Your operating system is MacOS, please manually deploy in the graphical interface ★★★★★\033[0m"
    exit
    echo
    echo
else
    echo
    echo -e "\033[1;32m unknow os $OS, exit! \033[0m"
    exit
    echo
    echo
fi
echo -e "\033[1;32m----------------------------------------------------------\033[0m"

#Type "robot token / TG account ID / domain / dump purpose tray ID"
read -p """Please enter the robot token and press Enter
    Your Bot Token =>:""" YOUR_BOT_TOKEN
#Judge token is entered correctly
while [[ "${#YOUR_BOT_TOKEN}" != 46 ]]; do
    echo -e "\033[1;32m★★★ The robot TOKEN input is incorrect, please re-enter or press "Ctrl+C" to end the installation! ★★★\033[0m"
    read -p """Please enter the robot token and press Enter
    Your Bot Token =>:""" YOUR_BOT_TOKEN
done

read -p """Please enter your domain name (resolved on cloudflare to the domain name of the VPS where your robot is located, format: bot.abc.com) and press Enter
    Your Domain Name =>:""" YOUR_DOMAIN_NAME
#Judge whether the domain name is correct
while [[ "$YOUR_DOMAIN_NAME" =~ "http" ]]; do
    echo -e "\033[1;32m★★★ "Your Domain Name" is entered incorrectly, you should enter the domain name you resolved on cloudflare and do not contain "http", please re-enter or press "Ctrl+C" to end the installation! ★★★\033[0m"
    read -p """Please enter your domain name (resolved on cloudflare to the domain name of the VPS where your robot is located, format: bot.abc.com) and press Enter
    Your Domain Name =>:""" YOUR_DOMAIN_NAME
done

read -p """Please enter the telegram account ID of the robot (get ID robot@userinfobot) and press Enter
    Your Telegram ID =>:""" YOUR_TELEGRAM_ID
#Determine whether the telegram ID is correct (by judging whether it is a pure number)
until [[ $YOUR_TELEGRAM_ID =~ ^-?[0-9]+$ ]]; do
    echo -e "\033[1;32m★★★ Your TG account ID is not correct, please re-enter or press "Ctrl+C" to end the installation!  ★★★\033[0m"
    read -p """Please enter the telegram account ID of the robot (get ID robot@userinfobot) and press Enter
    Your Telegram ID =>:""" YOUR_TELEGRAM_ID
done

read -p """Please enter the default destination team disk ID for the dump (do not specify the default destination address for the dump destination, the script forces the team disk ID to be entered) and press Enter
    Your Google Team Drive ID =>:""" YOUR_GOOGLE_TEAM_DRIVE_ID
#Judgment whether the google team drive ID is correct (the length of the team drive ID is 19 digits)
while [[ "${#YOUR_GOOGLE_TEAM_DRIVE_ID}" != 19 ]]; do
    echo -e "\033[1;32m★★★  Your Google team drive ID is incorrect, please re-enter or press "Ctrl+C" to end the installation! ★★★\033[0m"
    read -p """Please enter the default destination ID for the dump (do not specify the default address for the dump destination, the script forces you to enter the team disk ID) and press Enter
    Your Google Team Drive ID =>:""" YOUR_GOOGLE_TEAM_DRIVE_ID
done

cd ~ &&
    sed -i "s/bot_token/$YOUR_BOT_TOKEN/g" ./gd-utils-cht/config.js &&
    sed -i "s/your_tg_username/$YOUR_TELEGRAM_ID/g" ./gd-utils-cht/config.js && 
    sed -i "s/DEFAULT_TARGET = ''/DEFAULT_TARGET = '$YOUR_GOOGLE_TEAM_DRIVE_ID'/g" ./gd-utils-cht/config.js
echo -e "\033[1;32m----------------------------------------------------------\033[0m"

echo -e "\033[1;32m"process daemon pm2" starts installation...\033[0m"
cd /root/gd-utils-cht &&
    npm i pm2 -g && pm2 l
echo -e "\033[1;32m starts the daemon...\033[0m"
pm2 start server.js --node-args="--max-old-space-size=4096"
echo -e "\033[1;32m----------------------------------------------------------\033[0m"

echo -e "\033[1;32m"nginx" to start the installation...\033[0m"
cd ~ &&
    $cmd_install install nginx -y
echo
echo -e "\033[1;32m===== <<Configure nginx service>> ===== \033[0m"
echo
echo -e "\033[1;32m"nginx" starts a web service...\033[0m"

cd $nginx_conf
echo "server {
    listen 80;
    server_name $YOUR_DOMAIN_NAME;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    ssl on;
    ssl_certificate    /etc/ssl/certificate.crt;
    ssl_certificate_key    /etc/ssl/private.key;
    server_name $YOUR_DOMAIN_NAME;
    location / {
         proxy_pass http://127.0.0.1:23333/;
    }
}" >${nginx_conf}gdutilsbot.conf &&
    $rm_nginx_default

ls &&
    nginx -t &&
    nginx -c /etc/nginx/nginx.conf &&
    nginx -s reload &&
    netstat -tulpen
echo -e "\033[1;32m----------------------------------------------------------\033[0m"

echo -e "\033[1;32m"Check if the website is successfully deployed"...\033[0m"
curl $YOUR_DOMAIN_NAME/api/gdurl/count\?fid=124pjM5LggSuwI1n40bcD5tQ13wS0M6wg
echo
echo -e "\033[1;32m set Webhook service...\033[0m"
print_webhook=$(curl -F "url=https://$YOUR_DOMAIN_NAME/api/gdurl/tgbot" "https://api.telegram.org/bot$YOUR_BOT_TOKEN/setWebhook")
echo

# Determine whether the reverse proxy is successfully deployed
if [[ $print_webhook =~ "true" ]]; then
    echo -e "\033[1;32m★★★ Congratulations! GoogleDrive query and transfer robot deployment is successful, please return to the TG interface and send a "/help" to the bot to get help ★★★\033[0m"
else
    echo -e "\033[32m★★★ Unfortunately! Robot setup failed, please go back to check if the website is successfully deployed, and repeat this installation process ★★★\033[0m", exit!
fi
nginx -t && nginx -s reload
echo
echo

cd ~
rm -f gdutilsbotinstall.sh

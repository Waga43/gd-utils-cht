#!/bin/bash
echo
echo -e "\033[1;32m===== <<gdutils project one-click deployment script "TD query transfer">> =====\033[0m"
echo -e "\033[1;32m-----------------[ v2.1 by oneking ]-----------------\033[0m"
echo -e "\033[32m 1.\033[0m This script is a one-click deployment script for the "TD query dump" part of the gdutils project of TG;"
echo -e "\033[32m 2.\033[0m This script is suitable for CentOS/Debian/Ubuntu three operating systems, automatic identification, automatic matching of parameters and one-click deployment"
echo -e "\033[32m 3.\033[0m Because this script involves system upgrades and more dependent software, to avoid interruption, it is recommended to use the screen window to install"
echo -e "\033[32m 4.\033[0m Can be tested to install the system perfectly: Centos 7/8 debian 9/10 ubuntu 16.04/18.04/19.10/20.04"
echo -e "\033[32m 5.\033[0m If you have any problems during the deployment process, please send the "error screenshot" "Deploy VPS system name version" information to TG: onekings or vitaminor@gmail.com"
echo -e "\033[1;32m------------------------------------------------\033[0m"
read -s -n1 -p "★★★ Please press any key to start deployment, press "Ctrl+c" to terminate deployment ★★★"
echo
echo -e "\033[1;32m------------------------------------------------\033[0m"

#  Software tools need to be installed and dependence
insofts=(epel-release update upgrade wget curl git unzip zip python3-distutils python3 python3-pip)

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
    cmd_install="apt-get"                               #install command
    cmd_install_rely="build-essential"                  #c++ compilation environment
    nodejs_curl="https://deb.nodesource.com/setup_12.x" #nodejs download link
    cmd_install_rpm_build=""                            # install rpm-build
    echo
    echo -e "\033[1;32m★★★★★ Your operating system is Debian, and the "TD query dump" part of the gdutils project will be deployed soon for you ★★★★★\033[0m"
elif [[ "$os" = "Ubuntu" ]]; then
    cmd_install="sudo apt-get"
    cmd_install_rely="build-essential"
    nodejs_curl="https://deb.nodesource.com/setup_12.x"
    cmd_install_rpm_build=""
    echo
    echo -e "\033[1;32m★★★★★ Your operating system is Ubuntu, and the "TD query dump" part of the gdutils project will soon be deployed for you ★★★★★\033[0m"
elif [[ "$os" = "CentOS" ]]; then
    cmd_install="yum"
    cmd_install_rely="gcc-c++ make"
    nodejs_curl="https://rpm.nodesource.com/setup_12.x"
    cmd_install_rpm_build="yum install rpm-build -y"
    echo
    echo -e "\033[1;32m★★★★★ Your operating system is Centos, and the "TD query transfer" part of the gdutils project will soon be deployed for you ★★★★★\033[0m"
elif [[ "$os" = "mac" ]]; then
    echo
    echo -e "\033[1;32m★★★★★ Your operating system is MacOS, please manually deploy in the graphical interface ★★★★★\033[0m"
    exit
    echo
    echo
else
    echo
    echo -e "\033[1;32m unknown os $OS, exit! \033[0m"
    exit
    echo
    echo
fi

echo
echo -e "\033[1;32m===== <<Upgrade system/update software/installation tools/installation dependencies>> =====\033[0m"
echo

# Check whether sudo which and installation, as already installed skipped, the first means is not installed
if [[ "$(which which)" == "" ]]; then
    echo -e "\033[1;32m"which" starts installation...\033[0m"
    $cmd_install install which -y
    echo -e "\033[1;32m------------------------------------------------\033[0m"
elif [[ "$(which sudo)" == "" ]]; then
    echo -e "\033[1;32m"sudo" to start the installation...\033[0m"
    $cmd_install install sudo -y
    echo -e "\033[1;32m------------------------------------------------\033[0m"
fi

#Install tools and dependencies
for ((aloop = 0; aloop < ${#insofts[@]}; aloop++)); do
    if [ ${insofts[$aloop]} = "update" -o ${insofts[$aloop]} = "upgrade" ]; then
        echo -e "\033[1;32m“${insofts[$aloop]}"Start installation...\033[0m"
        $cmd_install ${insofts[$aloop]} -y
        echo -e "\033[1;32m------------------------------------------------\033[0m"
    else
        echo -e "\033[1;32m“${insofts[$aloop]}"Start installation...\033[0m"
        $cmd_install install ${insofts[$aloop]} -y
        echo -e "\033[1;32m------------------------------------------------\033[0m"
    fi
done

echo
echo -e "\033[1;32m===== <<Install gdutils dependency-nodejs and npm/install configuration gdutils>> =====\033[0m"
echo
$cmd_install install $cmd_install_rely -y
curl -sL $nodejs_curl | bash -
$cmd_install install nodejs -y
$cmd_install_rpm_build
git clone https://github.com/waga43/gd-utils-ettm && cd gd-utils-ettm
npm config set unsafe-perm=true
npm i

echo
echo -e "\033[1;32m★★★Congratulations! The "TD query transfer" part of the gdutils project has been deployed. Please upload sa to the "./gd-utils-ettm/sa/" directory to complete the final Configuration ★★★\033[0m"
echo

cd ~
rm -f gdutilscs.sh

# #########################gdutils Feature suggestion#################### ##############
# This section is recommended for gdutils project because I mainly use the search function so the following is recommended only involves inquiry
# 1- Put the following parameters into the configuration file settings: sa storage path
# 2- Change sa "random" use to "sequential" group use;
# 3- Increase the output mode, you can use the command line with parameters to choose, the specific mode is recommended:
#    ① According to the first or second folder display the number size
#    ②Can count multiple disks at one time and output the number and size of files on a single disk and the sum of several disks
#    ③ Obtain the folder name corresponding to the id or the disk to save the database, and give a command to query the historical record summary or the specified summary
# 4-During the query process, the output mode should not be output every time, but can be fixed + number change
# 5- Command parameters can be added before or after the ID, if it is necessary to fix one, it is added before the ID
# 6- The command line is also changed to the default sa mode
# ############################################## ##########################

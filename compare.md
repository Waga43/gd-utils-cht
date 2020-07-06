# Compare the speed difference of this tool and other similar tools in server side copy
Take copying[https://drive.google.com/drive/folders/1W9gf3ReGUboJUah-7XDg5jKXKl5XwQQ3](https://drive.google.com/drive/folders/1W9gf3ReGUboJUah-7XDg5jKXKl5XwQQ3)as an example（[ file statistics](https://gdurl.viegg.com/api/gdrive/count?fid=1W9gf3ReGUboJUah-7XDg5jKXKl5XwQQ3)）  
a total of 242 files and 26 folders

Unless otherwise specified, the following operating environment is on the local command line (hang agent)



## This tool takes 40 seconds
<!-- ![](https://viegg.oss-cn-shenzhen.aliyuncs.com/1592732262296.png)   -->
![](static/gdurl.png)

In addition, I executed the same command on a Los Angeles vps, which took 23 seconds. This speed is obtained by using the default configuration of **20 parallel requests** in this project . This value can be modified by yourself (there are methods below). The larger the number of parallel requests, the faster the total speed.

## AutoRclone takes 4 minutes and 57 seconds (4 minutes and 6 seconds to verify after removing the copy)
<!-- ![](https://viegg.oss-cn-shenzhen.aliyuncs.com/1592732547295.png) -->
![](static/autorclone.png)

##gclone takes 3 minutes and 7 seconds
<!-- ![](https://viegg.oss-cn-shenzhen.aliyuncs.com/1592732597593.png) -->
![](static/gclone.png)

## Why is there such a big difference in speed
First of all, it is necessary to clarify the principle of server side copy (hereinafter referred to as ssc).

As far as Google Drive itself is concerned, it will not actually copy it on its own file system because you ssc copied a file (otherwise no matter how big the hard disk will be filled), it just adds it to the database A record.

Therefore, no matter whether ssc is a large file or a small file, in theory, it takes the same time. When you use these tools, you can also feel that copying a bunch of small files is much slower than copying a few large files.

The official Google Drive API only provides the function of copying a single file, and cannot directly copy the entire folder. Can not even read the entire folder, only read the first layer of subfolders (folders) in a folder of information, similar to the Linux command line of `ls` command.

The ssc function of these three tools is essentially a call to the [ official file copy api](https://developers.google.com/drive/api/v3/reference/files/copy)的调用。

Then talk about the principle of this tool, the approximate steps are as follows:
- First, it will recursively read the information of all files and folders in the directory to be copied and save it locally.
- Then, filter out all the folder objects, and then create a new folder with the same name according to the parent-child relationship, and restore the original structure. (Keeping the original folder structure unchanged while maintaining speed, it really took a lot of work)
- According to the correspondence between the old and new folder IDs left when creating the folder in the previous step, call the official API to copy the files.

Thanks to the existence of the local database, it can continue execution from the breakpoint after the task is interrupted. For example, ctrl+cafter the user presses , the same copy command can be executed again, the tool will give three options:
<!-- ![](https://viegg.oss-cn-shenzhen.aliyuncs.com/1592735608511.png) -->
![](static/choose.png)

The other two tools also support breakpoint resumes. How do they do it? AutoRclone is a layer of encapsulation of rclone commands with python, and gclone is a magic change based on rclone. By the way-it is worth mentioning that-this tool is the official API called directly, does not depend on rclone.

I haven't read the source code of rclone carefully, but I can probably guess its working principle from its execution log. First add a little background knowledge: For all files (folders) objects that exist in Google drive, their lives are accompanied by a unique ID. Even if one file is a copy of another, their IDs are different.

So how does rclone know which files have been copied and which ones have not? If it does not save the record in the local database like me, then it can only search for files with the same name in the same path, and if so, compare their size/modification time/md5 value to determine whether they have been copied.

That is to say, in the worst case (assuming it is not cached), before copying a file, it must first call the official API to search and determine whether the file already exists!

In addition, although AutoRclone and gclone both support automatic switching of service accounts, but they perform a copy task when a single SA is calling the API, which is destined that they cannot adjust the request frequency too high-otherwise it may trigger a limit.

The tool also supports automatic switching of service accounts. The difference is that each request is randomly selected an SA. My [file statistics](https://gdurl.viegg.com/api/gdrive/count?fid=1W9gf3ReGUboJUah-7XDg5jKXKl5XwQQ3)interface uses 20 SA tokens, and the number of requests is set to 20, which is the average and In other words, the number of concurrent requests for a single SA is only once.

Therefore, the bottleneck is not to limit the frequency of SA, and in the running vps or agents, you can adjust the value according to each case PARALLEL_LIMIT (the config.jsinside).

Of course, if the daily traffic of a certain SA exceeds 750G, it will automatically switch to another SA and filter out the SA with exhausted traffic. When all SA traffic is used up, it will switch to a personal access token until the traffic is also exhausted, and the process eventually exits.

There are restrictions on using SA: In addition to daily traffic restrictions, in fact, each SA also has a **15G personal disk space** limit , which means that you can copy up to 15G files to a personal disk per SA, but to a team disk There is no such restriction.*

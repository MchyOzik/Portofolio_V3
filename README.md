cd /docker/web1
git clone https://mchyozik.github.io/Portofolio_V3/

Dockerfile
Search httpd
FROM httpd:2.4
COPY ./public{direktori}/ /usr/local/apache2/htdocs/

docker image ls
$ docker build -t web1{docker} .
$ docker run -d -p 8080:80 web1

docker container ls
ctrl + f untuk mencari mengganti warna
yang dicari adalah h1



.PHONY: all build

all: build

build: node_modules lib

dist: build src requirejs.conf.js config
	mkdir -p dist
	./node_modules/requirejs/bin/r.js -o ./config/build.conf.js	

# if package.json changes, install
node_modules: package.json
	npm install
	touch $@

lib: node_modules
	./node_modules/bower/bin/bower install

server: build
	npm start

clean:
	rm -rf node_modules lib dist

package: build

env=dev
deploy:
	./node_modules/.bin/lfcdn -e $(env)

## [1.2.4](https://github.com/cheminfo-js/genbank-parser/compare/v1.2.3...v1.2.4) (2020-05-23)



## [1.2.3](https://github.com/cheminfo-js/genbank-parser/compare/v1.2.2...v1.2.3) (2020-05-23)


### Bug Fixes

* fix parsing when definition contains an = character ([05fa113](https://github.com/cheminfo-js/genbank-parser/commit/05fa1132be0c9d5627185760c782e8e5f860df74))



## [1.2.2](https://github.com/cheminfo-js/genbank-parser/compare/v1.2.1...v1.2.2) (2020-05-23)


### Bug Fixes

* only description is always defined in reference ([3cd0ab3](https://github.com/cheminfo-js/genbank-parser/commit/3cd0ab3b56c31bb5b59f0950fb98a2b527ea1bdd))



## [1.2.1](https://github.com/cheminfo-js/genbank-parser/compare/v1.2.0...v1.2.1) (2020-05-23)


### Bug Fixes

* correct genbank parsed result typescript interface ([298a8ce](https://github.com/cheminfo-js/genbank-parser/commit/298a8ce4ff21f947b0aae071c0cfc6bf80e83ae5))



# [1.2.0](https://github.com/cheminfo-js/genbank-parser/compare/v1.1.2...v1.2.0) (2020-05-23)


### Features

* support parsing of genbank that does not have a genbank division ([d802694](https://github.com/cheminfo-js/genbank-parser/commit/d80269453e7b610d50bcb36370f8b7aa79f712ec))



## [1.1.2](https://github.com/cheminfo-js/genbank-parser/compare/v1.1.1...v1.1.2) (2020-03-16)


### Bug Fixes

* handle annotation with position instead of range ([a3756fe](https://github.com/cheminfo-js/genbank-parser/commit/a3756fe50f1f9a38aae22b2aac47a0c51b76f1a9))
* make version and keywords optional in ts definition ([9d25ea5](https://github.com/cheminfo-js/genbank-parser/commit/9d25ea5a037d895f227373aa8fe0009d4eb0fc74))



## [1.1.1](https://github.com/cheminfo-js/genbank-parser/compare/v1.1.0...v1.1.1) (2020-03-05)


### Bug Fixes

* initialize references to an empty array ([87907d5](https://github.com/cheminfo-js/genbank-parser/commit/87907d59c08d59fe29cf7b3e74bde87fb6e20ab5))



# [1.1.0](https://github.com/cheminfo-js/genbank-parser/compare/v1.0.0...v1.1.0) (2020-03-05)


### Bug Fixes

* fix inreachable code ([5b6fce1](https://github.com/cheminfo-js/genbank-parser/commit/5b6fce15c942933f09d9a915ea99b565c7a11fed))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/cheminfo-js/genbank-parser/compare/v0.2.0...v1.0.0) (2018-10-18)


### Features

* output date as an ISO string ([70b5656](https://github.com/cheminfo-js/genbank-parser/commit/70b5656))


### BREAKING CHANGES

* The date property for a parsed sequence was changed from a number to an
ISO string representation.
* If a sequence fails to be parsed, the function will now throw an error
instead of generating a warning in the result. It means that now the
function returns an array of sequence objects.


<a name="0.2.0"></a>
# [0.2.0](https://github.com/cheminfo-js/genbank-parser/compare/v0.1.0...v0.2.0) (2018-05-25)



<a name="0.1.0"></a>
# 0.1.0 (2018-05-17)




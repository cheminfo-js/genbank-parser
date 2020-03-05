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




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




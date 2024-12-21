#ifndef SRC_MODULE_UTILS_H_
#define SRC_MODULE_UTILS_H_

#include <v8.h>
#include <string>

bool ContainsTopLevelAwait(v8::Local<v8::String> code);
bool EndsWith(const v8::Local<v8::String>& v8_str, const std::string& suffix);
bool is_module(const std::string& filename);

#endif  // SRC_MODULE_UTILS_H_

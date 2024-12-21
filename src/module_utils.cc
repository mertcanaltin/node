#include "module_utils.h"
#include <v8.h>
#include <string>

// Top-level await control
bool ContainsTopLevelAwait(v8::Local<v8::String> code) {
  v8::String::Utf8Value utf8_value(v8::Isolate::GetCurrent(), code);
  std::string source_code(*utf8_value);
  return source_code.find("await") != std::string::npos;
}

// Checks if the string ends with a specific suffix
bool EndsWith(const v8::Local<v8::String>& v8_str, const std::string& suffix) {
  v8::String::Utf8Value utf8(v8::Isolate::GetCurrent(), v8_str);
  std::string str(*utf8);
  return str.size() >= suffix.size() &&
         str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
}

// function to check the “type” field in package.json (not done yet)
bool contains_package_json_with_type(const std::string& type) {
  // TODO(mertcanaltin): Implementation
  // can be done with a real file read operation.
  return false;
}
// module  mjs control
bool is_module(const std::string& filename) {
  auto isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::String> v8_filename =
      v8::String::NewFromUtf8(isolate, filename.c_str()).ToLocalChecked();

  return EndsWith(v8_filename, ".mjs") ||
         contains_package_json_with_type("module");
}

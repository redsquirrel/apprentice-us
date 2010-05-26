task :test do
  Dir.glob("test/*_test.js").each do |file|
    puts `node #{file}`
  end
  puts 'Tests Complete'
end
task :default => :test


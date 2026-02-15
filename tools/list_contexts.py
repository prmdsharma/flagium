from lxml import etree
import sys

def list_contexts(file_path):
    tree = etree.parse(file_path)
    ns = {
        'xbrli': 'http://www.xbrl.org/2003/instance'
    }
    
    contexts = tree.xpath('//xbrli:context', namespaces=ns)
    print(f"Found {len(contexts)} contexts.")
    
    for ctx in contexts:
        ctx_id = ctx.attrib.get('id')
        period = ctx.find('xbrli:period', namespaces=ns)
        if period is not None:
            start = period.find('xbrli:startDate', namespaces=ns)
            end = period.find('xbrli:endDate', namespaces=ns)
            instant = period.find('xbrli:instant', namespaces=ns)
            
            if start is not None and end is not None:
                print(f"ID: {ctx_id} | Type: Duration | {start.text} to {end.text}")
            elif instant is not None:
                print(f"ID: {ctx_id} | Type: Instant  | {instant.text}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        list_contexts(sys.argv[1])
